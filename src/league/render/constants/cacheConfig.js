const config = require('../../../config');

/**
 * Render cache settings — env overrides with config.js defaults.
 */
function getRenderCacheConfig() {
    const render = config.render || {};

    return {
        enabled: process.env.RENDER_CACHE_ENABLED !== undefined
            ? process.env.RENDER_CACHE_ENABLED !== 'false'
            : render.cacheEnabled !== false,
        renderTtlMs: Number(process.env.RENDER_CACHE_TTL_MS) || render.cacheTtlMs || 5 * 60 * 1000,
        renderMaxEntries: Number(process.env.RENDER_CACHE_MAX_ENTRIES) || render.cacheMaxEntries || 64,
        imageTtlMs: Number(process.env.RENDER_IMAGE_CACHE_TTL_MS) || render.imageCacheTtlMs || 15 * 60 * 1000,
        imageMaxEntries: Number(process.env.RENDER_IMAGE_CACHE_MAX_ENTRIES) || render.imageCacheMaxEntries || 200
    };
}

module.exports = { getRenderCacheConfig };