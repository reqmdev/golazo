const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    encodeTeamListNavId,
    parseTeamListNavId,
} = require('./teamListNav');

describe('teamListNav', () => {
    it('round-trips nav custom ids', () => {
        const id = encodeTeamListNavId('super-lig', 3, 'pp');
        const parsed = parseTeamListNavId(id);

        assert.deepEqual(parsed, { slug: 'super-lig', page: 3, action: 'pp' });
    });
});