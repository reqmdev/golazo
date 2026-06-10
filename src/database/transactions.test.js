const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isTransactionNotSupported } = require('./transactions');

describe('transactions', () => {
    it('detects standalone Mongo transaction errors', () => {
        const err = new Error('Transaction numbers are only allowed on a replica set member or mongos');

        assert.equal(isTransactionNotSupported(err), true);
    });

    it('does not treat generic errors as unsupported transactions', () => {
        assert.equal(isTransactionNotSupported(new Error('duplicate key')), false);
    });
});