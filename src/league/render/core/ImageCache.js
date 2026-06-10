const { loadImage } = require('@napi-rs/canvas');
const { getRenderCacheConfig } = require('../constants/cacheConfig');
const { fetchLogoBuffer } = require('../../utils/validateLogoUrl');

/** @type {Map<string, { image: import('@napi-rs/canvas').Image, expiresAt: number }>} */
const cache = new Map();

/** @type {Map<string, Promise<import('@napi-rs/canvas').Image | null>>} */
const inflight = new Map();

/**
 * @param {string} url
 * @param {{ ttlMs?: number, maxEntries?: number }} [options]
 */
async function getImage(url, options = {}) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const settings = getRenderCacheConfig();
    const ttlMs = options.ttlMs ?? settings.imageTtlMs;
    const maxEntries = options.maxEntries ?? settings.imageMaxEntries;
    const now = Date.now();
    const cached = cache.get(url);

    if (cached && cached.expiresAt > now) {
        return cached.image;
    }

    if (inflight.has(url)) {
        return inflight.get(url);
    }

    const promise = (async () => {
        try {
            const buffer = await fetchLogoBuffer(url);

            if (!buffer) {
                return null;
            }

            const image = await loadImage(buffer);
            cache.set(url, { image, expiresAt: now + ttlMs });
            pruneCache(maxEntries);
            return image;
        } catch {
            return null;
        } finally {
            inflight.delete(url);
        }
    })();

    inflight.set(url, promise);
    return promise;
}

function pruneCache(maxEntries) {
    if (cache.size <= maxEntries) {
        return;
    }

    const overflow = cache.size - maxEntries;
    const keys = cache.keys();

    for (let i = 0; i < overflow; i += 1) {
        const key = keys.next().value;
        if (key) cache.delete(key);
    }
}

function clearImageCache() {
    cache.clear();
    inflight.clear();
}

function getImageCacheStats() {
    return { size: cache.size, inflight: inflight.size };
}

module.exports = {
    getImage,
    clearImageCache,
    getImageCacheStats
};