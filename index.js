/**
 * Golazo entry — Bot-Hosting / Pterodactyl expect this file at /home/container/index.js
 * Startup tab → "Bot Node.js file" = index.js (or use src/index.js which forwards here)
 */
require('dotenv').config();
const fs = require('fs');
const DiscordBot = require('./src/client/DiscordBot');
const { disconnectMongo } = require('./src/database/connect');
const { reportError } = require('./src/utils/errorReporter');
const { startHealthServer, stopHealthServer } = require('./src/health/server');

fs.writeFileSync('./terminal.log', '', 'utf-8');
const client = new DiscordBot();

module.exports = client;

startHealthServer(client).catch((err) => {
    console.error('[health] failed to start:', err?.message || err);
});

let shuttingDown = false;

async function shutdown(reason, exitCode = 0) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    try {
        await stopHealthServer();
        client.stopCacheSweepers?.();
        client.clearStatusRotation?.();
        await client.destroy();
    } catch {
        // best-effort
    }

    try {
        await disconnectMongo();
    } catch {
        // best-effort
    }

    process.exit(exitCode);
}

client.connect();

process.on('unhandledRejection', (err) => {
    console.error(err);
    reportError(err, 'unhandledRejection');
});

process.on('uncaughtException', (err) => {
    console.error(err);
    reportError(err, 'uncaughtException')
        .finally(() => shutdown('uncaughtException', 1));
});

process.on('SIGTERM', () => {
    shutdown('SIGTERM', 0);
});

process.on('SIGINT', () => {
    shutdown('SIGINT', 0);
});