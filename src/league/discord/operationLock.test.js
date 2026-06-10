const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withOperationLock, leagueLockKey, clearOperationLocks } = require('./operationLock');

describe('operationLock', () => {
    it('serializes operations on the same key', async () => {
        clearOperationLocks();
        const order = [];

        const first = withOperationLock('test-key', async () => {
            order.push('start-1');
            await new Promise((resolve) => setTimeout(resolve, 30));
            order.push('end-1');
        });

        const second = withOperationLock('test-key', async () => {
            order.push('start-2');
            order.push('end-2');
        });

        await Promise.all([first, second]);
        assert.deepEqual(order, ['start-1', 'end-1', 'start-2', 'end-2']);
    });

    it('does not block unrelated keys', async () => {
        clearOperationLocks();
        const order = [];

        const blocked = withOperationLock('a', async () => {
            order.push('a-start');
            await new Promise((resolve) => setTimeout(resolve, 30));
            order.push('a-end');
        });

        const parallel = withOperationLock('b', async () => {
            order.push('b');
        });

        await Promise.all([blocked, parallel]);
        assert.equal(order[0], 'a-start');
        assert.equal(order[1], 'b');
    });

    it('builds stable league lock keys', () => {
        assert.equal(
            leagueLockKey('123', 'Super-Lig', 'league-write'),
            '123:super-lig:league-write'
        );
    });

});