const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

describe('cacheConfig', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        delete require.cache[require.resolve('../../../config')];
        delete require.cache[require.resolve('./cacheConfig')];
    });

    beforeEach(() => {
        delete require.cache[require.resolve('../../../config')];
        delete require.cache[require.resolve('./cacheConfig')];
    });

    it('reads defaults from config.js', () => {
        const { getRenderCacheConfig } = require('./cacheConfig');
        const settings = getRenderCacheConfig();

        assert.equal(settings.enabled, true);
        assert.equal(settings.renderTtlMs, 30 * 60 * 1000);
        assert.equal(settings.imageTtlMs, 15 * 60 * 1000);
    });

    it('allows env overrides', () => {
        process.env.RENDER_CACHE_ENABLED = 'false';
        process.env.RENDER_CACHE_TTL_MS = '120000';

        const { getRenderCacheConfig } = require('./cacheConfig');
        const settings = getRenderCacheConfig();

        assert.equal(settings.enabled, false);
        assert.equal(settings.renderTtlMs, 120000);
    });
});