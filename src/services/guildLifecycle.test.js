const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { LruMap } = require('../utils/lruMap');
const {
    resolveGuildLeaveDataPolicy,
    purgeGuildClientCaches
} = require('./guildLifecycle');

describe('guildLifecycle', () => {
    it('defaults guild leave policy to cache_only', () => {
        const original = process.env.GOLAZO_GUILD_LEAVE_DATA_POLICY;
        delete process.env.GOLAZO_GUILD_LEAVE_DATA_POLICY;

        assert.equal(resolveGuildLeaveDataPolicy(), 'cache_only');

        process.env.GOLAZO_GUILD_LEAVE_DATA_POLICY = 'archive';
        assert.equal(resolveGuildLeaveDataPolicy(), 'archive');

        process.env.GOLAZO_GUILD_LEAVE_DATA_POLICY = 'delete';
        assert.equal(resolveGuildLeaveDataPolicy(), 'delete');

        process.env.GOLAZO_GUILD_LEAVE_DATA_POLICY = 'invalid';
        assert.equal(resolveGuildLeaveDataPolicy(), 'cache_only');

        if (original === undefined) {
            delete process.env.GOLAZO_GUILD_LEAVE_DATA_POLICY;
        } else {
            process.env.GOLAZO_GUILD_LEAVE_DATA_POLICY = original;
        }
    });

    it('purgeGuildClientCaches removes guild-scoped entries', () => {
        const client = {
            prefixCache: new LruMap({ maxSize: 10 }),
            guildLocaleCache: new LruMap({ maxSize: 10 })
        };

        client.prefixCache.set('guild-1', '!');
        client.guildLocaleCache.set('guild-1', 'en');
        client.prefixCache.set('guild-2', '?');

        purgeGuildClientCaches(client, 'guild-1');

        assert.equal(client.prefixCache.has('guild-1'), false);
        assert.equal(client.guildLocaleCache.has('guild-1'), false);
        assert.equal(client.prefixCache.get('guild-2'), '?');
    });
});