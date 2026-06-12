const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { encodeChampionsNavId, parseChampionsNavId } = require('../discord/championsNav');

describe('championsNav', () => {
    it('encodes and parses nav ids', () => {
        const id = encodeChampionsNavId('super-lig', 'gs', '1');
        const parsed = parseChampionsNavId(id);

        assert.equal(parsed.slug, 'super-lig');
        assert.equal(parsed.action, 'gs');
        assert.equal(parsed.extra, '1');
    });
});
