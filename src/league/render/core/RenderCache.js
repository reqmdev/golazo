const { getRenderCacheConfig } = require('../constants/cacheConfig');
const { LruMap } = require('../../../utils/lruMap');

const settings = getRenderCacheConfig();

/** @type {LruMap} */
const cache = new LruMap({ maxSize: settings.renderMaxEntries });

/**
 * @param {string} key
 * @returns {Buffer | null}
 */
function getCachedRender(key) {
    const { enabled } = getRenderCacheConfig();

    if (!enabled) {
        return null;
    }

    const entry = cache.get(key);

    if (!entry) {
        return null;
    }

    if (entry.expiresAt < Date.now()) {
        cache.delete(key);
        return null;
    }

    return entry.buffer;
}

/**
 * @param {string} key
 * @param {Buffer} buffer
 * @param {{ ttlMs?: number, maxEntries?: number, leagueId?: string, guildId?: string }} [options]
 */
function setCachedRender(key, buffer, options = {}) {
    const current = getRenderCacheConfig();

    if (!current.enabled) {
        return;
    }

    const ttlMs = options.ttlMs ?? current.renderTtlMs;

    cache.set(key, {
        buffer,
        expiresAt: Date.now() + ttlMs,
        leagueId: options.leagueId,
        guildId: options.guildId
    });
}

function clearRenderCache() {
    cache.clear();
}

/**
 * @param {string} leagueId
 */
function clearRenderCacheByLeagueId(leagueId) {
    for (const key of [...cache.keys()]) {
        const entry = cache.peek(key);

        if (entry?.leagueId === leagueId) {
            cache.delete(key);
        }
    }
}

/**
 * @param {string} guildId
 */
function clearRenderCacheByGuildId(guildId) {
    for (const key of [...cache.keys()]) {
        const entry = cache.peek(key);

        if (entry?.guildId === guildId) {
            cache.delete(key);
        }
    }
}

function sweepExpiredRenderCache() {
    let removed = 0;
    const now = Date.now();

    for (const key of [...cache.keys()]) {
        const entry = cache.peek(key);

        if (entry && entry.expiresAt < now) {
            cache.delete(key);
            removed++;
        }
    }

    return removed;
}

function getRenderCacheStats() {
    return { size: cache.size };
}

module.exports = {
    getCachedRender,
    setCachedRender,
    clearRenderCache,
    clearRenderCacheByLeagueId,
    clearRenderCacheByGuildId,
    sweepExpiredRenderCache,
    getRenderCacheStats
};