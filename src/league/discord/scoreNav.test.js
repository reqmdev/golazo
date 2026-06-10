const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    encodeScoreNavId,
    parseScoreNavId,
    encodeScoreSelectId,
    parseScoreSelectId,
    encodeScoreModalId,
    parseScoreModalId,
} = require('./scoreNav');
const { ACTIONS } = require('./fixtureNav');

describe('scoreNav', () => {
    it('round-trips nav custom ids', () => {
        const id = encodeScoreNavId('super-lig', 2, 1, ACTIONS.NEXT_ROUND);
        const parsed = parseScoreNavId(id);

        assert.deepEqual(parsed, {
            slug: 'super-lig',
            round: 2,
            page: 1,
            action: ACTIONS.NEXT_ROUND,
        });
    });

    it('round-trips select custom ids', () => {
        const id = encodeScoreSelectId('super-lig', 3, 2);
        const parsed = parseScoreSelectId(id);

        assert.deepEqual(parsed, {
            slug: 'super-lig',
            round: 3,
            page: 2,
        });
    });

    it('round-trips modal custom ids', () => {
        const matchId = '507f1f77bcf86cd799439011';
        const id = encodeScoreModalId('super-lig', 2, 1, matchId);
        const parsed = parseScoreModalId(id);

        assert.deepEqual(parsed, {
            slug: 'super-lig',
            round: 2,
            page: 1,
            matchId,
        });
    });
});