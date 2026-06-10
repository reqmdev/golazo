const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { redactSecrets } = require('./redactSecrets');

describe('redactSecrets', () => {
    it('redacts configured env secrets', () => {
        const originalToken = process.env.CLIENT_TOKEN;
        process.env.CLIENT_TOKEN = 'super-secret-token-value';

        try {
            const output = redactSecrets('Error: super-secret-token-value failed');
            assert.equal(output.includes('super-secret-token-value'), false);
            assert.match(output, /\[REDACTED\]/);
        } finally {
            process.env.CLIENT_TOKEN = originalToken;
        }
    });

    it('redacts mongodb URIs', () => {
        const output = redactSecrets('connect failed mongodb+srv://user:pass@cluster.example/golazo');
        assert.match(output, /\[REDACTED_MONGODB_URI\]/);
    });
});