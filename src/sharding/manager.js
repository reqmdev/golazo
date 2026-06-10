require('dotenv').config();

const path = require('path');
const { ShardingManager } = require('discord.js');
const { error, info, success } = require('../utils/Console');

const token = process.env.CLIENT_TOKEN;

if (!token) {
    error('CLIENT_TOKEN is required for sharded mode.');
    process.exit(1);
}

const manager = new ShardingManager(path.join(__dirname, '../index.js'), {
    token,
    totalShards: process.env.GOLAZO_SHARD_COUNT || 'auto',
    respawn: true
});

manager.on('shardCreate', (shard) => {
    info(`Launched shard ${shard.id}`);

    shard.on('death', () => {
        error(`Shard ${shard.id} died — respawn enabled.`);
    });
});

manager.spawn({ timeout: 60_000 })
    .then((shards) => {
        success(`Sharding manager running with ${shards.size} shard(s).`);
    })
    .catch((err) => {
        error('Failed to spawn shards:', err);
        process.exit(1);
    });