const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildKnockoutBracket, buildPlayoffBracket } = require('./knockoutBracket');

describe('knockoutBracket', () => {
    it('creates bye slots for non-power-of-two counts', () => {
        const ties = buildKnockoutBracket({
            teamIds: ['t1', 't2', 't3'],
            round: 'sf',
        });

        assert.equal(ties.length, 2);
        assert.equal(ties.filter((t) => t.isBye).length, 1);
    });

    it('builds playoff bracket for three teams', () => {
        const teams = [
            { teamId: 'seed1', seed: 1, leagueRank: 1 },
            { teamId: 'seed2', seed: 2, leagueRank: 2 },
            { teamId: 'seed3', seed: 3, leagueRank: 3 },
        ];

        const ties = buildPlayoffBracket(teams);
        assert.equal(ties.length, 1);
        assert.equal(ties[0].teamAId, 'seed2');
        assert.equal(ties[0].teamBId, 'seed3');
        assert.equal(ties[0].awaitsSeed1, 'seed1');
    });
});
