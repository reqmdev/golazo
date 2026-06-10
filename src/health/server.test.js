const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { startHealthServer, stopHealthServer } = require('./server');

describe('health server', () => {
    /** @type {string | undefined} */
    let originalPort;

    beforeEach(() => {
        originalPort = process.env.GOLAZO_HEALTH_PORT;
    });

    afterEach(async () => {
        await stopHealthServer();

        if (originalPort === undefined) {
            delete process.env.GOLAZO_HEALTH_PORT;
        } else {
            process.env.GOLAZO_HEALTH_PORT = originalPort;
        }
    });

    it('does not start when port is unset', () => {
        delete process.env.GOLAZO_HEALTH_PORT;

        const server = startHealthServer({ user: null, guilds: { cache: { size: 0 } } });

        assert.equal(server, null);
    });

    it('returns health payload', async () => {
        const port = 18_700 + Math.floor(Math.random() * 200);
        process.env.GOLAZO_HEALTH_PORT = String(port);

        const client = {
            user: { id: 'bot-id' },
            guilds: { cache: { size: 3 } },
        };

        await startHealthServer(client);

        const response = await fetch(`http://127.0.0.1:${port}/health`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.status, 'ok');
        assert.equal(body.checks.discord, 'up');
        assert.equal(body.guilds, 3);
    });

    it('returns Prometheus metrics on /metrics', async () => {
        const port = 18_800 + Math.floor(Math.random() * 200);
        process.env.GOLAZO_HEALTH_PORT = String(port);

        const client = {
            user: { id: 'bot-id' },
            guilds: { cache: { size: 7 } },
        };

        await startHealthServer(client);

        const response = await fetch(`http://127.0.0.1:${port}/metrics`);
        const body = await response.text();

        assert.equal(response.status, 200);
        assert.match(body, /golazo_guilds 7/);
        assert.match(body, /# TYPE golazo_guilds gauge/);
    });

    it('returns 503 on /ready when mongo is disconnected', async () => {
        const port = 18_900 + Math.floor(Math.random() * 200);
        process.env.GOLAZO_HEALTH_PORT = String(port);

        await startHealthServer({ user: null, guilds: { cache: { size: 0 } } });

        const response = await fetch(`http://127.0.0.1:${port}/ready`);
        const body = await response.json();

        assert.equal(response.status, 503);
        assert.equal(body.checks.mongo, 'down');
        assert.equal(body.checks.discord, 'starting');
    });
});