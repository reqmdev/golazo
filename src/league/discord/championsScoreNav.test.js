const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    encodeChampionsScoreNavId,
    parseChampionsScoreNavId,
    encodeChampionsScoreModalId,
    parseChampionsScoreModalId,
    encodeChampionsPenModalId,
    parseChampionsPenModalId,
} = require('../discord/championsScoreNav');

describe('championsScoreNav', () => {
    it('encodes and parses nav ids', () => {
        const id = encodeChampionsScoreNavId('demo', 2, 'pp');
        assert.equal(id, 'lcs:demo:2:pp');
        assert.deepEqual(parseChampionsScoreNavId(id), { slug: 'demo', page: 2, action: 'pp' });
    });

    it('encodes and parses score modal ids', () => {
        const id = encodeChampionsScoreModalId('demo', 1, 'abc123');
        assert.equal(id, 'lcs:mdl:demo:1:abc123');
        assert.deepEqual(parseChampionsScoreModalId(id), { slug: 'demo', page: 1, matchId: 'abc123' });
    });

    it('encodes and parses penalty modal ids', () => {
        const id = encodeChampionsPenModalId('demo', 1, 'abc123');
        assert.equal(id, 'lcs:pen:demo:1:abc123');
        assert.deepEqual(parseChampionsPenModalId(id), { slug: 'demo', page: 1, matchId: 'abc123' });
    });

    it('parses penalty nav action with match id suffix', () => {
        const id = encodeChampionsScoreNavId('demo', 1, 'pen:match42');
        assert.deepEqual(parseChampionsScoreNavId(id), { slug: 'demo', page: 1, action: 'pen:match42' });
    });
});
