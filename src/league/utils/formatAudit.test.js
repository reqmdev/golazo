const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { formatAuditLog } = require('./formatAudit');

describe('formatAuditLog', () => {
    it('returns empty message for no entries', () => {
        assert.equal(formatAuditLog([]), 'No audit entries yet.');
    });

    it('formats entries with action and summary', () => {
        const output = formatAuditLog([
            {
                action: 'MATCH_RESULT',
                actorId: 'user-1',
                summary: 'Score submitted',
                createdAt: new Date('2026-06-01T12:00:00Z')
            }
        ]);

        assert.match(output, /MATCH_RESULT/);
        assert.match(output, /user-1/);
        assert.match(output, /Score submitted/);
    });
});