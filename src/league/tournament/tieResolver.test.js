const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveTieWinner, resolveAggregate, needsPenalties } = require('./tieResolver');

describe('tieResolver', () => {
    const teamA = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const teamB = 'bbbbbbbbbbbbbbbbbbbbbbbb';

    it('resolves single-leg winner', () => {
        const tie = { tieId: 'final-0', teamAId: teamA, teamBId: teamB, isBye: false };
        const matches = [{
            tieId: 'final-0',
            homeTeamId: teamA,
            awayTeamId: teamB,
            status: 'completed',
            score: { home: 2, away: 1 },
        }];

        assert.equal(resolveTieWinner(tie, matches), teamA);
    });

    it('resolves two-legged aggregate winner', () => {
        const tie = { tieId: 'sf-0', teamAId: teamA, teamBId: teamB, isBye: false };
        const matches = [
            {
                tieId: 'sf-0',
                leg: 1,
                homeTeamId: teamA,
                awayTeamId: teamB,
                status: 'completed',
                score: { home: 1, away: 0 },
            },
            {
                tieId: 'sf-0',
                leg: 2,
                homeTeamId: teamB,
                awayTeamId: teamA,
                status: 'completed',
                score: { home: 2, away: 1 },
            },
        ];

        const { goalsA, goalsB } = resolveAggregate(matches, teamA, teamB);
        assert.equal(goalsA, 2);
        assert.equal(goalsB, 2);
        assert.equal(resolveTieWinner(tie, matches), null);
        assert.equal(needsPenalties(tie, matches), true);
    });

    it('resolves penalties after aggregate draw', () => {
        const tie = { tieId: 'sf-0', teamAId: teamA, teamBId: teamB, isBye: false };
        const matches = [
            {
                tieId: 'sf-0',
                leg: 1,
                homeTeamId: teamA,
                awayTeamId: teamB,
                status: 'completed',
                score: { home: 1, away: 1 },
                tieBreak: { penaltiesHome: 4, penaltiesAway: 3, decidedBy: 'penalties' },
            },
        ];

        assert.equal(resolveTieWinner(tie, matches), teamA);
        assert.equal(needsPenalties(tie, matches), false);
    });

    it('returns bye winner immediately', () => {
        const tie = { tieId: 'sf-0', teamAId: teamA, teamBId: null, isBye: true };
        assert.equal(resolveTieWinner(tie, []), teamA);
    });
});
