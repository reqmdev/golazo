const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveGroupQualifiers } = require('./groupStandingCalculator');

describe('resolveGroupQualifiers', () => {
    function entry(teamId, rank, points, goalDifference = 0, goalsFor = 0) {
        return { teamId, rank, points, goalDifference, goalsFor, played: 3, won: 0, drawn: 0, lost: 0, goalsAgainst: 0 };
    }

    it('picks top two from each group for 8-team format', () => {
        const groups = [
            {
                groupId: 'A',
                entries: [entry('a1', 1, 9), entry('a2', 2, 6), entry('a3', 3, 3)],
            },
            {
                groupId: 'B',
                entries: [entry('b1', 1, 9), entry('b2', 2, 6), entry('b3', 3, 3)],
            },
        ];

        const qualified = resolveGroupQualifiers(groups, 2, 4, false);
        assert.deepEqual(qualified, ['a1', 'a2', 'b1', 'b2']);
    });

    it('adds best third-place teams when useBestThirds is enabled', () => {
        const groups = [
            {
                groupId: 'A',
                entries: [entry('a1', 1, 9), entry('a2', 2, 6), entry('a3', 3, 1, -2, 2)],
            },
            {
                groupId: 'B',
                entries: [entry('b1', 1, 9), entry('b2', 2, 6), entry('b3', 3, 4, 1, 5)],
            },
            {
                groupId: 'C',
                entries: [entry('c1', 1, 9), entry('c2', 2, 6), entry('c3', 3, 3, 0, 4)],
            },
        ];

        const qualified = resolveGroupQualifiers(groups, 2, 8, true);
        assert.equal(qualified.length, 8);
        assert.ok(qualified.includes('b3'));
        assert.ok(qualified.includes('c3'));
        assert.ok(!qualified.includes('a3'));
    });

    it('trims excess qualifiers by cross-group ranking', () => {
        const groups = [
            {
                groupId: 'A',
                entries: [entry('a1', 1, 9), entry('a2', 2, 8), entry('a3', 3, 7)],
            },
            {
                groupId: 'B',
                entries: [entry('b1', 1, 6), entry('b2', 2, 5), entry('b3', 3, 4)],
            },
        ];

        const qualified = resolveGroupQualifiers(groups, 2, 3, false);
        assert.deepEqual(qualified, ['a1', 'a2', 'b1']);
    });
});
