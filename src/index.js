require('dotenv').config();
const fs = require('fs');
const DiscordBot = require('./client/DiscordBot');
const { disconnectMongo } = require('./database/connect');
const { reportError } = require('./utils/errorReporter');
const { startHealthServer, stopHealthServer } = require('./health/server');

fs.writeFileSync('./terminal.log', '', 'utf-8');
const client = new DiscordBot();

module.exports = client;

startHealthServer(client).catch((err) => {
    console.error('[health] failed to start:', err?.message || err);
});

let shuttingDown = false;

/**
 * @param {string} reason
 * @param {number} [exitCode]
 */
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