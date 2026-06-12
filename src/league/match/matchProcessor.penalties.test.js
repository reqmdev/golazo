const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildPenaltiesUpdate } = require('../match/matchProcessor');
const LeagueError = require('../errors/LeagueError');

describe('matchProcessor penalties', () => {
    it('buildPenaltiesUpdate stores tieBreak payload', () => {
        const update = buildPenaltiesUpdate({ penaltiesHome: 4, penaltiesAway: 3 });
        assert.deepEqual(update.tieBreak, {
            penaltiesHome: 4,
            penaltiesAway: 3,
            decidedBy: 'penalties',
        });
    });

    it('rejects drawn penalties', () => {
        assert.throws(
            () => buildPenaltiesUpdate({ penaltiesHome: 3, penaltiesAway: 3 }),
            (err) => err instanceof LeagueError && err.code === 'CL_PENALTIES_DRAW',
        );
    });
});
