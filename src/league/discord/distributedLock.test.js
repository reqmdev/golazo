const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    LOCK_TTL_MS,
    RENEWAL_INTERVAL_MS,
    clearLockRenewals,
    stopLockRenewal
} = require('./distributedLock');

describe('distributedLock', () => {
    it('renews before the lock TTL expires', () => {
        assert.ok(RENEWAL_INTERVAL_MS < LOCK_TTL_MS);
        assert.ok(RENEWAL_INTERVAL_MS >= LOCK_TTL_MS / 4);
    });

    it('clears renewal timers safely when no lock is held', () => {
        clearLockRenewals();
        stopLockRenewal('missing-key');
        assert.ok(true);
    });
});