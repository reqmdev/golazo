const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveFormat, seededGroupDraw, nextPowerOfTwo } = require('./formatResolver');

describe('formatResolver', () => {
    it('resolves 2-team final-only format', () => {
        const format = resolveFormat(2);
        assert.equal(format.templateId, 'final_only');
        assert.equal(format.skipGroupStage, true);
        assert.equal(format.initialKnockoutRound, 'final');
    });

    it('resolves 3-team playoff format', () => {
        const format = resolveFormat(3);
        assert.equal(format.templateId, 'playoff_final');
        assert.equal(format.initialKnockoutRound, 'playoff');
    });

    it('resolves 4-team single group format', () => {
        const format = resolveFormat(4);
        assert.equal(format.groupCount, 1);
        assert.equal(format.teamsPerGroup, 4);
        assert.equal(format.knockoutSize, 2);
    });

    it('resolves 8-team dual group format', () => {
        const format = resolveFormat(8);
        assert.equal(format.templateId, 'dual_group_8');
        assert.equal(format.groupCount, 2);
        assert.equal(format.initialKnockoutRound, 'sf');
    });

    it('resolves 16-team quad group format', () => {
        const format = resolveFormat(16);
        assert.equal(format.templateId, 'quad_group_16');
        assert.equal(format.groupCount, 4);
        assert.equal(format.knockoutSize, 8);
    });

    it('throws for invalid team counts', () => {
        assert.throws(() => resolveFormat(1));
        assert.throws(() => resolveFormat(17));
    });

    it('seeded draw distributes all teams across groups', () => {
        const teams = [
            { teamId: 'a', seed: 1, leagueRank: 1 },
            { teamId: 'b', seed: 2, leagueRank: 2 },
            { teamId: 'c', seed: 3, leagueRank: 3 },
            { teamId: 'd', seed: 4, leagueRank: 4 },
            { teamId: 'e', seed: 5, leagueRank: 5 },
            { teamId: 'f', seed: 6, leagueRank: 6 },
            { teamId: 'g', seed: 7, leagueRank: 7 },
            { teamId: 'h', seed: 8, leagueRank: 8 },
        ];

        const groups = seededGroupDraw(teams, 2);
        const total = groups.reduce((sum, g) => sum + g.teamIds.length, 0);

        assert.equal(total, 8);
        assert.equal(groups.length, 2);
    });

    it('nextPowerOfTwo rounds up correctly', () => {
        assert.equal(nextPowerOfTwo(3), 4);
        assert.equal(nextPowerOfTwo(8), 8);
        assert.equal(nextPowerOfTwo(9), 16);
    });
});
