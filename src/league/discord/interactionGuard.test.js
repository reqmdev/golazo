const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    isDuplicateInteraction,
    markInteractionHandled,
    clearInteractionGuard
} = require('./interactionGuard');

describe('interactionGuard', () => {
    it('tracks handled interaction ids', () => {
        clearInteractionGuard();

        assert.equal(isDuplicateInteraction('ix-1'), false);
        markInteractionHandled('ix-1');
        assert.equal(isDuplicateInteraction('ix-1'), true);
        assert.equal(isDuplicateInteraction('ix-2'), false);
    });

    it('clears tracked ids', () => {
        clearInteractionGuard();
        markInteractionHandled('ix-clear');
        clearInteractionGuard();
        assert.equal(isDuplicateInteraction('ix-clear'), false);
    });
});