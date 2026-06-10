const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MATCH_STATUS } = require('../constants/matchStatus');
const { calculateStandings } = require('./standingCalculator');

const oid = (suffix) => `0000000000000000000000${suffix}`;

const POINTS = { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 };
const FORFEIT = { winnerGoals: 3, loserGoals: 0 };
const TIEBREAKERS = ['points', 'gd', 'gf', 'head_to_head', 'team_id'];

function team(id) {
    return { _id: oid(id), name: `Team ${id}`, isActive: true };
}

function match(homeId, awayId, homeGoals, awayGoals, overrides = {}) {
    return {
        _id: oid(overrides.id || '99'),
        round: overrides.round ?? 1,
        leg: overrides.leg ?? 1,
        homeTeamId: oid(homeId),
        awayTeamId: oid(awayId),
        status: overrides.status ?? MATCH_STATUS.COMPLETED,
        score: { home: homeGoals, away: awayGoals },
        meta: overrides.meta ?? {}
    };
}

describe('standingCalculator', () => {
    it('produces deterministic output for the same input', () => {
        const teams = [team('01'), team('02'), team('03')];
        const matches = [
            match('01', '02', 2, 0, { id: '01' }),
            match('03', '01', 1, 1, { id: '02', round: 2 }),
            match('02', '03', 0, 1, { id: '03', round: 3 })
        ];

        const first = calculateStandings(teams, matches, POINTS, TIEBREAKERS, FORFEIT);
        const second = calculateStandings(teams, matches, POINTS, TIEBREAKERS, FORFEIT);

        assert.deepEqual(first, second);
    });

    it('ignores postponed, cancelled, and duplicate match ids', () => {
        const teams = [team('01'), team('02')];
        const base = match('01', '02', 2, 0, { id: '01' });
        const duplicate = { ...base, score: { home: 9, away: 9 } };
        const postponed = match('02', '01', 0, 0, {
            id: '02',
            round: 2,
            status: MATCH_STATUS.POSTPONED
        });
        const cancelled = match('02', '01', 0, 0, {
            id: '03',
            round: 3,
            status: MATCH_STATUS.CANCELLED
        });

        const table = calculateStandings(
            teams,
            [base, duplicate, postponed, cancelled],
            POINTS,
            TIEBREAKERS,
            FORFEIT
        );

        const home = table.find((row) => row.teamId.toString() === oid('01'));
        const away = table.find((row) => row.teamId.toString() === oid('02'));

        assert.equal(home.played, 1);
        assert.equal(home.points, 3);
        assert.equal(away.played, 1);
        assert.equal(away.points, 0);
    });

    it('rolls back corrected scores via full rebuild semantics', () => {
        const teams = [team('01'), team('02')];
        const original = match('01', '02', 2, 0, { id: '01' });
        const corrected = match('01', '02', 1, 2, { id: '01' });

        const before = calculateStandings(teams, [original], POINTS, TIEBREAKERS, FORFEIT);
        const after = calculateStandings(teams, [corrected], POINTS, TIEBREAKERS, FORFEIT);

        const winnerBefore = before.find((row) => row.teamId.toString() === oid('01'));
        const winnerAfter = after.find((row) => row.teamId.toString() === oid('02'));

        assert.equal(winnerBefore.points, 3);
        assert.equal(winnerAfter.points, 3);
        assert.deepEqual(winnerAfter.form, ['W']);
    });

    it('tracks last-five form in processing order', () => {
        const teams = [team('01'), team('02')];
        const matches = [];

        for (let i = 0; i < 6; i += 1) {
            matches.push(
                match('01', '02', 1, 0, { id: String(i).padStart(2, '0'), round: i + 1 })
            );
        }

        const table = calculateStandings(teams, matches, POINTS, TIEBREAKERS, FORFEIT);
        const home = table.find((row) => row.teamId.toString() === oid('01'));

        assert.equal(home.form.length, 5);
        assert.deepEqual(home.form, ['W', 'W', 'W', 'W', 'W']);
    });

    it('handles walkover forfeits with default score', () => {
        const teams = [team('01'), team('02')];
        const walkover = {
            _id: oid('01'),
            round: 1,
            leg: 1,
            homeTeamId: oid('01'),
            awayTeamId: oid('02'),
            status: MATCH_STATUS.WALKOVER,
            score: { home: null, away: null },
            meta: { walkoverWinnerId: oid('02') }
        };

        const table = calculateStandings(teams, [walkover], POINTS, TIEBREAKERS, FORFEIT);
        const away = table.find((row) => row.teamId.toString() === oid('02'));

        assert.equal(away.won, 1);
        assert.equal(away.gf, 3);
        assert.equal(away.ga, 0);
        assert.equal(away.points, 3);
    });

    it('uses head_to_head with league points rules', () => {
        const teams = [team('01'), team('02'), team('03')];
        const customPoints = { pointsWin: 4, pointsDraw: 2, pointsLoss: 1 };
        const matches = [
            match('01', '02', 1, 1, { id: '01' }),
            match('02', '01', 1, 1, { id: '02', round: 2 }),
            match('01', '03', 2, 0, { id: '03', round: 3 }),
            match('02', '03', 2, 0, { id: '04', round: 4 }),
            match('03', '01', 2, 0, { id: '05', round: 5 }),
            match('03', '02', 2, 0, { id: '06', round: 6 })
        ];

        const table = calculateStandings(teams, matches, customPoints, ['head_to_head', 'team_id'], FORFEIT);
        const t1 = table.find((row) => row.teamId.toString() === oid('01'));
        const t2 = table.find((row) => row.teamId.toString() === oid('02'));

        assert.equal(t1.points, t2.points);
        assert.ok(t1.rank < t2.rank || t2.rank < t1.rank);
    });

    it('breaks ties deterministically with team_id', () => {
        const teams = [team('02'), team('01')];
        const table = calculateStandings(teams, [], POINTS, ['team_id'], FORFEIT);

        assert.equal(table[0].teamId.toString(), oid('01'));
        assert.equal(table[1].teamId.toString(), oid('02'));
    });
});