const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('MatchService smoke', () => {
    it('loads MatchService without ReferenceError (runWithTransaction import)', () => {
        assert.doesNotThrow(() => {
            require('../services/MatchService');
        });
    });

    it('exports submitPenalties', () => {
        const MatchService = require('../services/MatchService');
        assert.equal(typeof MatchService.submitPenalties, 'function');
    });
});
