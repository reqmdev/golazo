const crypto = require('crypto');
const mongoose = require('mongoose');

const LOCK_TTL_MS = 30_000;
const RETRY_MS = 50;
const RENEWAL_INTERVAL_MS = Math.floor(LOCK_TTL_MS / 3);

/** @type {Map<string, NodeJS.Timeout>} */
const renewalTimers = new Map();

function getModel() {
    return mongoose.model('LeagueOperationLock');
}

/**
 * @returns {boolean}
 */
function isDistributedLockEnabled() {
    if (process.env.GOLAZO_DISTRIBUTED_LOCK === 'false') {
        return false;
    }

    if (process.env.GOLAZO_DISTRIBUTED_LOCK === 'true') {
        return mongoose.connection?.readyState === 1;
    }

    return mongoose.connection?.readyState === 1;
}

/**
 * @param {string} key
 * @param {string} token
 */
async function renewDistributedLock(key, token) {
    if (!token || !isDistributedLockEnabled()) {
        return false;
    }

    const expiresAt = new Date(Date.now() + LOCK_TTL_MS);
    const renewed = await getModel().findOneAndUpdate(
        { _id: key, token },
        { $set: { expiresAt } },
        { new: true }
    ).lean().exec();

    return Boolean(renewed);
}

/**
 * @param {string} key
 * @param {string} token
 */
function startLockRenewal(key, token) {
    stopLockRenewal(key);

    if (!token || !isDistributedLockEnabled()) {
        return;
    }

    const timer = setInterval(() => {
        renewDistributedLock(key, token).catch(() => {
            stopLockRenewal(key);
        });
    }, RENEWAL_INTERVAL_MS);

    if (typeof timer.unref === 'function') {
        timer.unref();
    }

    renewalTimers.set(key, timer);
}

/**
 * @param {string} key
 */
function stopLockRenewal(key) {
    const timer = renewalTimers.get(key);

    if (!timer) {
        return;
    }

    clearInterval(timer);
    renewalTimers.delete(key);
}

/**
 * @param {string} key
 * @param {number} waitMs
 */
async function acquireDistributedLock(key, waitMs) {
    if (!isDistributedLockEnabled()) {
        return null;
    }

    const token = crypto.randomUUID();
    const deadline = Date.now() + waitMs;

    while (Date.now() < deadline) {
        const now = new Date();
        const expiresAt = new Date(Date.now() + LOCK_TTL_MS);

        const stolen = await getModel().findOneAndUpdate(
            {
                _id: key,
                expiresAt: { $lte: now }
            },
            { $set: { token, expiresAt } },
            { new: true }
        ).lean().exec();

        if (stolen?.token === token) {
            startLockRenewal(key, token);
            return token;
        }

        try {
            await getModel().create({ _id: key, token, expiresAt });
            startLockRenewal(key, token);
            return token;
        } catch (err) {
            if (err?.code !== 11000) {
                throw err;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }

    return null;
}

/**
 * @param {string} key
 * @param {string | null} token
 */
async function releaseDistributedLock(key, token) {
    stopLockRenewal(key);

    if (!token || !isDistributedLockEnabled()) {
        return;
    }

    await getModel().deleteOne({ _id: key, token }).exec();
}

function clearLockRenewals() {
    for (const key of [...renewalTimers.keys()]) {
        stopLockRenewal(key);
    }
}

module.exports = {
    acquireDistributedLock,
    releaseDistributedLock,
    renewDistributedLock,
    startLockRenewal,
    stopLockRenewal,
    clearLockRenewals,
    isDistributedLockEnabled,
    LOCK_TTL_MS,
    RENEWAL_INTERVAL_MS
};