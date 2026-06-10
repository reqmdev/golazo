const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    encodeStandingsNavId,
    parseStandingsNavId,
    resolveStandingsNavTarget,
} = require('./standingsNav');

describe('standingsNav', () => {
    it('round-trips nav custom ids', () => {
        const id = encodeStandingsNavId('super-lig', 2, 'np');
        const parsed = parseStandingsNavId(id);

        assert.deepEqual(parsed, { slug: 'super-lig', page: 2, action: 'np' });
    });

    it('resolves page navigation targets', () => {
        assert.deepEqual(resolveStandingsNavTarget('pp', 2, 4), { page: 1 });
        assert.deepEqual(resolveStandingsNavTarget('np', 2, 4), { page: 3 });
    });
});