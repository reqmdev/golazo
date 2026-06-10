const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MATCH_STATUS } = require('../constants/matchStatus');
const {
    dedupeMatches,
    sortMatchesForProcessing,
    resolveMatchGoals,
    deriveOutcome,
    isStandingsEligible
} = require('./matchResult');
const { pickUniqueMatch } = require('./matchLookup');
const LeagueError = require('../errors/LeagueError');

const oid = (suffix) => `0000000000000000000000${suffix}`;

function makeMatch(overrides = {}) {
    return {
        _id: oid('01'),
        round: 1,
        leg: 1,
        homeTeamId: oid('aa'),
        awayTeamId: oid('bb'),
        status: MATCH_STATUS.COMPLETED,
        score: { home: 2, away: 1 },
        meta: {},
        ...overrides
    };
}

describe('matchResult', () => {
    it('dedupeMatches drops duplicate fixture slots', () => {
        const first = makeMatch({ _id: oid('01'), round: 1, leg: 1 });
        const duplicateSlot = makeMatch({
            _id: oid('02'),
            round: 1,
            leg: 1,
            homeTeamId: oid('aa'),
            awayTeamId: oid('bb')
        });

        const result = dedupeMatches([first, duplicateSlot]);

        assert.equal(result.length, 1);
        assert.equal(result[0]._id, oid('01'));
    });

    it('dedupeMatches keeps first occurrence by _id', () => {
        const first = makeMatch({ _id: oid('01'), score: { home: 1, away: 0 } });
        const duplicate = makeMatch({ _id: oid('01'), score: { home: 9, away: 9 } });
        const other = makeMatch({ _id: oid('02'), round: 2 });

        const result = dedupeMatches([first, duplicate, other]);

        assert.equal(result.length, 2);
        assert.equal(result[0].score.home, 1);
    });

    it('sortMatchesForProcessing orders by round, leg, then _id', () => {
        const matches = [
            makeMatch({ _id: oid('03'), round: 2, leg: 1 }),
            makeMatch({ _id: oid('01'), round: 1, leg: 2 }),
            makeMatch({ _id: oid('02'), round: 1, leg: 1 })
        ];

        const sorted = sortMatchesForProcessing(matches).map((m) => m._id);

        assert.deepEqual(sorted, [oid('02'), oid('01'), oid('03')]);
    });

    it('isStandingsEligible excludes postponed and cancelled', () => {
        assert.equal(isStandingsEligible(makeMatch({ status: MATCH_STATUS.COMPLETED })), true);
        assert.equal(isStandingsEligible(makeMatch({ status: MATCH_STATUS.WALKOVER })), true);
        assert.equal(isStandingsEligible(makeMatch({ status: MATCH_STATUS.POSTPONED })), false);
        assert.equal(isStandingsEligible(makeMatch({ status: MATCH_STATUS.CANCELLED })), false);
        assert.equal(isStandingsEligible(makeMatch({ status: MATCH_STATUS.SCHEDULED })), false);
    });

    it('resolveMatchGoals returns null for ineligible statuses', () => {
        assert.equal(resolveMatchGoals(makeMatch({ status: MATCH_STATUS.POSTPONED })), null);
        assert.equal(resolveMatchGoals(makeMatch({ status: MATCH_STATUS.CANCELLED })), null);
    });

    it('resolveMatchGoals handles walkover with configured forfeit score', () => {
        const match = makeMatch({
            status: MATCH_STATUS.WALKOVER,
            score: { home: null, away: null },
            meta: { walkoverWinnerId: oid('aa') }
        });

        assert.deepEqual(
            resolveMatchGoals(match, { winnerGoals: 3, loserGoals: 0 }),
            { home: 3, away: 0 }
        );
    });

    it('resolveMatchGoals rejects invalid completed scores', () => {
        assert.equal(resolveMatchGoals(makeMatch({ score: { home: -1, away: 0 } })), null);
        assert.equal(resolveMatchGoals(makeMatch({ score: { home: 1.5, away: 0 } })), null);
    });

    it('deriveOutcome applies custom points rules', () => {
        const rules = { pointsWin: 4, pointsDraw: 2, pointsLoss: 1 };
        const win = deriveOutcome(2, 1, rules);
        const draw = deriveOutcome(1, 1, rules);

        assert.deepEqual(win.home, { result: 'W', points: 4 });
        assert.deepEqual(win.away, { result: 'L', points: 1 });
        assert.deepEqual(draw.home, { result: 'D', points: 2 });
    });
});

describe('matchLookup', () => {
    it('pickUniqueMatch returns the only candidate', () => {
        const match = makeMatch({ status: MATCH_STATUS.SCHEDULED });
        assert.equal(pickUniqueMatch([match]), match);
    });

    it('pickUniqueMatch filters by round when provided', () => {
        const r1 = makeMatch({ round: 1, status: MATCH_STATUS.SCHEDULED });
        const r2 = makeMatch({ _id: oid('02'), round: 2, status: MATCH_STATUS.SCHEDULED });

        assert.equal(pickUniqueMatch([r1, r2], { round: 2 }), r2);
    });

    it('pickUniqueMatch throws when multiple matches and no round', () => {
        const r1 = makeMatch({ round: 1, status: MATCH_STATUS.SCHEDULED });
        const r2 = makeMatch({ _id: oid('02'), round: 2, status: MATCH_STATUS.SCHEDULED });

        assert.throws(
            () => pickUniqueMatch([r1, r2]),
            (err) => err instanceof LeagueError && err.code === 'AMBIGUOUS_MATCH_ROUNDS'
        );
    });
});