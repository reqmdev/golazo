const http = require('http');
const mongoose = require('mongoose');
const { renderPrometheus, setGauge } = require('../metrics/registry');
const { getRenderCacheStats } = require('../league/render/core/RenderCache');

/** @type {import('http').Server | null} */
let server = null;

/**
 * @param {import('../client/DiscordBot')} client
 */
function startHealthServer(client) {
    const port = Number(process.env.GOLAZO_HEALTH_PORT);

    if (!port || port < 1) {
        return null;
    }

    const startedAt = Date.now();

    server = http.createServer((req, res) => {
        if (req.url === '/metrics') {
            setGauge('golazo_guilds', client?.guilds?.cache?.size ?? 0);
            setGauge('golazo_uptime_seconds', Math.floor((Date.now() - startedAt) / 1000));
            setGauge('golazo_render_cache_entries', getRenderCacheStats().size);
            setGauge('golazo_mongo_ready', mongoose.connection.readyState === 1 ? 1 : 0);
            setGauge('golazo_discord_ready', client?.user?.id ? 1 : 0);

            res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
            res.end(renderPrometheus());
            return;
        }

        if (req.url !== '/health' && req.url !== '/ready') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'not_found' }));
            return;
        }

        const mongoReady = mongoose.connection.readyState === 1;
        const discordReady = Boolean(client?.user?.id);
        const ready = req.url === '/ready' ? mongoReady && discordReady : true;

        const body = {
            status: ready ? 'ok' : 'degraded',
            checks: {
                mongo: mongoReady ? 'up' : 'down',
                discord: discordReady ? 'up' : 'starting',
            },
            uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
            guilds: client?.guilds?.cache?.size ?? 0,
        };

        res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
    });

    server.listen(port, '0.0.0.0');

    return new Promise((resolve, reject) => {
        server.once('listening', () => {
            console.log(`[health] listening on :${port}`);
            resolve(server);
        });

        server.once('error', reject);
    });
}

function stopHealthServer() {
    return new Promise((resolve) => {
        if (!server) {
            resolve();
            return;
        }

        server.close(() => {
            server = null;
            resolve();
        });
    });
}

module.exports = {
    startHealthServer,
    stopHealthServer,
};