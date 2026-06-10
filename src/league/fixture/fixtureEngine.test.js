const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildLeagueSchedule, getTotalRounds, getExpectedMatchCount, normalizeTeamIds } = require('./fixtureEngine');
const { validateSchedule } = require('./scheduleValidator');
const { pairingKey } = require('./pairingKey');

const T4 = ['team-d', 'team-a', 'team-c', 'team-b'];
const T3 = ['team-b', 'team-a', 'team-c'];
const T5 = ['team-e', 'team-a', 'team-c', 'team-b', 'team-d'];

describe('fixtureEngine', () => {
    it('produces deterministic output for the same input', () => {
        const first = buildLeagueSchedule(T4, { legs: 2 });
        const second = buildLeagueSchedule(T4, { legs: 2 });
        assert.deepEqual(first, second);
    });

    it('sorts team order internally so input permutation is identical', () => {
        const a = buildLeagueSchedule(['z', 'a', 'm'], { legs: 1 });
        const b = buildLeagueSchedule(['m', 'z', 'a'], { legs: 1 });
        assert.deepEqual(a, b);
    });

    it('generates correct match counts for single and double round robin', () => {
        const single = buildLeagueSchedule(T4, { legs: 1 });
        const double = buildLeagueSchedule(T4, { legs: 2 });

        assert.equal(single.length, getExpectedMatchCount(4, { legs: 1 }));
        assert.equal(double.length, getExpectedMatchCount(4, { legs: 2 }));
        assert.equal(getTotalRounds(4, { legs: 2 }), 6);
    });

    it('has no duplicate pairings per leg', () => {
        const fixtures = buildLeagueSchedule(T5, { legs: 2 });

        for (const leg of [1, 2]) {
            const keys = fixtures.filter((f) => f.leg === leg).map((f) => f.pairingKey);
            assert.equal(keys.length, new Set(keys).size);
        }
    });

    it('keeps home/away balance within one per leg', () => {
        const fixtures = buildLeagueSchedule(T5, { legs: 1 });
        const teams = normalizeTeamIds(T5);

        for (const id of teams) {
            const home = fixtures.filter((f) => f.homeTeamId === id).length;
            const away = fixtures.filter((f) => f.awayTeamId === id).length;
            assert.ok(Math.abs(home - away) <= 1, `imbalance for ${id}: ${home}H ${away}A`);
        }
    });

    it('limits consecutive home or away streaks in leg 1 (bye breaks streak)', () => {
        const fixtures = buildLeagueSchedule(T5, { legs: 1 });
        const teams = normalizeTeamIds(T5);
        const maxRound = Math.max(...fixtures.filter((f) => f.leg === 1).map((f) => f.round));

        for (const id of teams) {
            let streak = 0;
            let last = null;

            for (let round = 1; round <= maxRound; round++) {
                const roundFixtures = fixtures.filter((f) => f.leg === 1 && f.round === round);
                const isBye = roundFixtures.some((f) => f.byeTeamIds.includes(id));

                if (isBye) {
                    streak = 0;
                    last = null;
                    continue;
                }

                const match = roundFixtures.find(
                    (f) => f.homeTeamId === id || f.awayTeamId === id
                );
                const venue = match.homeTeamId === id ? 'H' : 'A';
                streak = venue === last ? streak + 1 : 1;
                last = venue;
                assert.ok(streak <= 2, `team ${id} has ${streak} consecutive ${venue} (round ${round})`);
            }
        }
    });

    it('assigns exactly one bye per round for odd team counts', () => {
        const fixtures = buildLeagueSchedule(T3, { legs: 1 });
        const byeByRound = new Map();

        for (const fixture of fixtures) {
            const bye = fixture.byeTeamIds[0];
            byeByRound.set(fixture.round, bye);
        }

        assert.equal(byeByRound.size, getTotalRounds(3, { legs: 1 }));

        const byeCounts = {};

        for (const bye of byeByRound.values()) {
            byeCounts[bye] = (byeCounts[bye] || 0) + 1;
        }

        for (const id of normalizeTeamIds(T3)) {
            assert.equal(byeCounts[id], 1);
        }
    });

    it('leg 2 reverses home and away from leg 1', () => {
        const fixtures = buildLeagueSchedule(T4, { legs: 2 });
        const leg1 = fixtures.filter((f) => f.leg === 1);
        const leg2 = fixtures.filter((f) => f.leg === 2);

        for (const m1 of leg1) {
            const m2 = leg2.find((f) => f.pairingKey === m1.pairingKey);
            assert.ok(m2);
            assert.equal(m2.homeTeamId, m1.awayTeamId);
            assert.equal(m2.awayTeamId, m1.homeTeamId);
        }
    });

    it('passes scheduleValidator for all standard sizes', () => {
        for (const teams of [T3, T4, T5]) {
            for (const legs of [1, 2]) {
                const fixtures = buildLeagueSchedule(teams, { legs });
                validateSchedule(fixtures, normalizeTeamIds(teams), legs);
            }
        }
    });

    it('passes scheduleValidator for all team counts up to league max', () => {
        for (let count = 2; count <= 20; count += 1) {
            const teams = Array.from({ length: count }, (_, index) => `team-${String(index + 1).padStart(2, '0')}`);

            for (const legs of [1, 2]) {
                const fixtures = buildLeagueSchedule(teams, { legs });
                validateSchedule(fixtures, normalizeTeamIds(teams), legs);
            }
        }
    });

    it('uses stable pairing keys', () => {
        assert.equal(pairingKey('b', 'a'), 'a:b');
        assert.equal(pairingKey('a', 'b'), 'a:b');
    });
});