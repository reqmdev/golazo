const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

describe('resolveHealthPort', () => {
    const original = {
        GOLAZO_HEALTH_PORT: process.env.GOLAZO_HEALTH_PORT,
        PORT: process.env.PORT
    };

    afterEach(() => {
        if (original.GOLAZO_HEALTH_PORT === undefined) {
            delete process.env.GOLAZO_HEALTH_PORT;
        } else {
            process.env.GOLAZO_HEALTH_PORT = original.GOLAZO_HEALTH_PORT;
        }

        if (original.PORT === undefined) {
            delete process.env.PORT;
        } else {
            process.env.PORT = original.PORT;
        }

        delete require.cache[require.resolve('./resolveHealthPort')];
    });

    beforeEach(() => {
        delete require.cache[require.resolve('./resolveHealthPort')];
    });

    it('prefers GOLAZO_HEALTH_PORT over PORT', () => {
        process.env.GOLAZO_HEALTH_PORT = '9090';
        process.env.PORT = '3000';

        const { resolveHealthPort } = require('./resolveHealthPort');

        assert.equal(resolveHealthPort(), 9090);
    });

    it('falls back to PORT for cloud hosts', () => {
        delete process.env.GOLAZO_HEALTH_PORT;
        process.env.PORT = '10000';

        const { resolveHealthPort } = require('./resolveHealthPort');

        assert.equal(resolveHealthPort(), 10000);
    });

    it('returns 0 when no port is configured', () => {
        delete process.env.GOLAZO_HEALTH_PORT;
        delete process.env.PORT;

        const { resolveHealthPort } = require('./resolveHealthPort');

        assert.equal(resolveHealthPort(), 0);
    });
});