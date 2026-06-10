const LeagueError = require('../errors/LeagueError');
const {
    acquireDistributedLock,
    releaseDistributedLock,
    isDistributedLockEnabled
} = require('./distributedLock');

const LOCK_WAIT_MS = Number(process.env.GOLAZO_LOCK_WAIT_MS) || 25_000;

/** @type {Map<string, Promise<void>>} */
const tail = new Map();

/**
 * Serialize operations per lock key (e.g. guild:league:league-write).
 * In-process queue + optional MongoDB lock for multi-instance safety.
 *
 * @param {string} key
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 * @template T
 */
async function withOperationLock(key, fn) {
    const previous = tail.get(key) || Promise.resolve();

    let release;
    const current = new Promise((resolve) => {
        release = resolve;
    });

    tail.set(key, previous.then(() => current));

    const timeout = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new LeagueError('OPERATION_LOCKED'));
        }, LOCK_WAIT_MS);
    });

    let distributedToken = null;

    try {
        await Promise.race([previous, timeout]);
        distributedToken = await acquireDistributedLock(key, LOCK_WAIT_MS);

        if (distributedToken === null && isDistributedLockEnabled()) {
            throw new LeagueError('OPERATION_LOCKED');
        }

        return await fn();
    } catch (err) {
        throw err;
    } finally {
        await releaseDistributedLock(key, distributedToken);
        release();
        if (tail.get(key) === current) {
            tail.delete(key);
        }
    }
}

function leagueLockKey(guildId, leagueSlug, scope) {
    return `${guildId}:${leagueSlug.toLowerCase()}:${scope}`;
}

function clearOperationLocks() {
    tail.clear();
}

module.exports = {
    withOperationLock,
    leagueLockKey,
    clearOperationLocks,
    LOCK_WAIT_MS
};