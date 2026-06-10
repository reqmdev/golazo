const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    encodeFixtureNavId,
    parseFixtureNavId,
    resolveNavTarget,
    ACTIONS,
} = require('./fixtureNav');

describe('fixtureNav', () => {
    it('round-trips nav custom ids', () => {
        const id = encodeFixtureNavId('super-lig', 2, 1, ACTIONS.NEXT_ROUND);
        const parsed = parseFixtureNavId(id);

        assert.deepEqual(parsed, {
            slug: 'super-lig',
            round: 2,
            page: 1,
            action: ACTIONS.NEXT_ROUND,
        });
    });

    it('resolves week navigation targets', () => {
        assert.deepEqual(
            resolveNavTarget(ACTIONS.PREV_ROUND, 1, 2, 6, 3),
            { round: 1, page: 1 },
        );
        assert.deepEqual(
            resolveNavTarget(ACTIONS.NEXT_ROUND, 3, 1, 6, 2),
            { round: 4, page: 1 },
        );
        assert.deepEqual(
            resolveNavTarget(ACTIONS.NEXT_PAGE, 2, 1, 6, 3),
            { round: 2, page: 2 },
        );
    });
});