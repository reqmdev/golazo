const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { LruMap } = require('./lruMap');

describe('LruMap', () => {
    it('evicts oldest entry when maxSize exceeded', () => {
        const map = new LruMap({ maxSize: 2 });

        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);

        assert.equal(map.has('a'), false);
        assert.equal(map.get('b'), 2);
        assert.equal(map.get('c'), 3);
    });

    it('refreshes LRU position on get', () => {
        const map = new LruMap({ maxSize: 2 });

        map.set('a', 1);
        map.set('b', 2);
        map.get('a');
        map.set('c', 3);

        assert.equal(map.has('b'), false);
        assert.equal(map.get('a'), 1);
        assert.equal(map.get('c'), 3);
    });

    it('sweepExpired removes stale entries', () => {
        const map = new LruMap({ maxSize: 10, defaultTtlMs: 50 });

        map.set('fresh', 'ok');
        map.set('stale', 'old', { ttlMs: 1 });

        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        return wait(5).then(() => {
            const removed = map.sweepExpired();

            assert.equal(removed, 1);
            assert.equal(map.has('stale'), false);
            assert.equal(map.get('fresh'), 'ok');
        });
    });
});