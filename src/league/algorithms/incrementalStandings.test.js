const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MATCH_STATUS } = require('../constants/matchStatus');
const {
    canUseIncrementalStandings,
    applyMatchDelta,
    incrementalStandingsUpdate
} = require('./incrementalStandings');

const oid = (suffix) => `0000000000000000000000${suffix}`;

function baseEntries() {
    return [
        {
            teamId: oid('aa'),
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0,
            form: [],
            rank: 1
        },
        {
            teamId: oid('bb'),
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0,
            form: [],
            rank: 2
        }
    ];
}

function completedMatch(score) {
    return {
        _id: oid('01'),
        round: 1,
        leg: 1,
        homeTeamId: oid('aa'),
        awayTeamId: oid('bb'),
        status: MATCH_STATUS.COMPLETED,
        score,
        meta: {}
    };
}

describe('incrementalStandings', () => {
    it('rejects incremental mode when head_to_head is configured', () => {
        assert.equal(canUseIncrementalStandings(['points', 'head_to_head']), false);
        assert.equal(canUseIncrementalStandings(['points', 'gd']), true);
    });

    it('applies a completed match delta', () => {
        const entries = applyMatchDelta(
            baseEntries(),
            completedMatch({ home: 2, away: 1 }),
            { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 },
            {},
            'add'
        );

        const home = entries.find((entry) => entry.teamId.toString() === oid('aa'));
        const away = entries.find((entry) => entry.teamId.toString() === oid('bb'));

        assert.equal(home.played, 1);
        assert.equal(home.points, 3);
        assert.equal(away.points, 0);
        assert.deepEqual(home.form, ['W']);
    });

    it('replaces a corrected score incrementally', () => {
        const league = {
            settings: { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 },
            tiebreakers: ['points', 'gd']
        };

        const previous = completedMatch({ home: 2, away: 1 });
        const updated = completedMatch({ home: 1, away: 1 });
        const seeded = applyMatchDelta(
            baseEntries(),
            previous,
            league.settings,
            {},
            'add'
        );

        const result = incrementalStandingsUpdate(
            seeded,
            updated,
            previous,
            [updated],
            league,
            {}
        );

        const home = result.find((entry) => entry.teamId.toString() === oid('aa'));
        const away = result.find((entry) => entry.teamId.toString() === oid('bb'));

        assert.equal(home.points, 1);
        assert.equal(away.points, 1);
        assert.equal(home.played, 1);
    });
});