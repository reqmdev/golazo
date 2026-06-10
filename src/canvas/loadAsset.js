const path = require('path');
const fs = require('fs');
const { loadImage } = require('@napi-rs/canvas');
const { getRenderCacheConfig } = require('../league/render/constants/cacheConfig');
const { LruMap } = require('../utils/lruMap');

const ASSETS_ROOT = path.join(__dirname, '..', 'assets', 'canvas');

const imageSettings = getRenderCacheConfig();

/** @type {LruMap} */
const imageCache = new LruMap({
    maxSize: imageSettings.imageMaxEntries,
    defaultTtlMs: imageSettings.imageTtlMs
});

/**
 * @param {string} relativePath
 */
function resolveAssetPath(relativePath) {
    return path.join(ASSETS_ROOT, relativePath);
}

/**
 * @param {string} relativePath
 */
function assetExists(relativePath) {
    return fs.existsSync(resolveAssetPath(relativePath));
}

/**
 * @param {string} relativePath
 */
async function getAssetImage(relativePath) {
    const fullPath = resolveAssetPath(relativePath);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const cached = imageCache.get(fullPath);

    if (cached) {
        return cached;
    }

    const image = await loadImage(fullPath);
    imageCache.set(fullPath, image);
    return image;
}

function clearAssetCache() {
    imageCache.clear();
}

function sweepExpiredAssetCache() {
    return imageCache.sweepExpired();
}

module.exports = {
    ASSETS_ROOT,
    resolveAssetPath,
    assetExists,
    getAssetImage,
    clearAssetCache,
    sweepExpiredAssetCache
};