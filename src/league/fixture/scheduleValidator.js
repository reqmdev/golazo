const { pairingKey } = require('./pairingKey');
const { getRoundsPerLeg } = require('./pairGenerator');

/**
 * Validates a generated schedule. Throws on violation (fail-fast during generation).
 *
 * @param {object[]} fixtures
 * @param {string[]} sortedTeamIds
 * @param {number} legs
 */
function validateSchedule(fixtures, sortedTeamIds, legs) {
    const teamIds = sortedTeamIds.map((id) => id.toString());
    const teamSet = new Set(teamIds);
    const roundsPerLeg = getRoundsPerLeg(teamIds.length);

    if (fixtures.length === 0) {
        throw new Error('Schedule is empty.');
    }

    /** @type {Map<number, Set<string>>} */
    const teamsPerRound = new Map();
    /** @type {Map<number, Set<string>>} */
    const pairingsPerLeg = new Map();

    for (const leg of Array.from({ length: legs }, (_, i) => i + 1)) {
        pairingsPerLeg.set(leg, new Set());
    }

    /** @type {Record<string, { home: number, away: number }>} */
    const venueTotals = {};

    for (const id of teamIds) {
        venueTotals[id] = { home: 0, away: 0 };
    }

    for (const fixture of fixtures) {
        const home = fixture.homeTeamId.toString();
        const away = fixture.awayTeamId.toString();

        if (!teamSet.has(home) || !teamSet.has(away)) {
            throw new Error(`Unknown team in fixture: ${home} vs ${away}`);
        }

        if (home === away) {
            throw new Error(`Team cannot play itself: ${home}`);
        }

        const roundKey = fixture.round * 100 + fixture.leg;

        if (!teamsPerRound.has(roundKey)) {
            teamsPerRound.set(roundKey, new Set());
        }

        const roundTeams = teamsPerRound.get(roundKey);

        if (roundTeams.has(home) || roundTeams.has(away)) {
            throw new Error(`Team plays twice in round ${fixture.round} leg ${fixture.leg}.`);
        }

        roundTeams.add(home);
        roundTeams.add(away);

        const legPairs = pairingsPerLeg.get(fixture.leg);
        const key = pairingKey(home, away);

        if (legPairs.has(key)) {
            throw new Error(`Duplicate pairing in leg ${fixture.leg}: ${key}`);
        }

        legPairs.add(key);

        venueTotals[home].home += 1;
        venueTotals[away].away += 1;
    }

    // Each pair exactly once per leg (round-robin completeness).
    const expectedPairsPerLeg = (teamIds.length * (teamIds.length - 1)) / 2;

    for (const [leg, pairs] of pairingsPerLeg.entries()) {
        if (pairs.size !== expectedPairsPerLeg) {
            throw new Error(`Leg ${leg} has ${pairs.size} pairings, expected ${expectedPairsPerLeg}.`);
        }
    }

    // Home/away balance per leg (difference at most 1).
    for (const leg of Array.from({ length: legs }, (_, i) => i + 1)) {
        const legFixtures = fixtures.filter((f) => f.leg === leg);

        for (const id of teamIds) {
            const home = legFixtures.filter((f) => f.homeTeamId.toString() === id).length;
            const away = legFixtures.filter((f) => f.awayTeamId.toString() === id).length;

            if (Math.abs(home - away) > 1) {
                throw new Error(`Team ${id} leg ${leg} home/away imbalance: ${home}H ${away}A`);
            }
        }
    }

    // Global round bounds.
    const maxRound = Math.max(...fixtures.map((f) => f.round));

    if (maxRound !== roundsPerLeg * legs) {
        throw new Error(`Expected max round ${roundsPerLeg * legs}, got ${maxRound}.`);
    }

    // Odd team count: each team rests exactly once per leg.
    if (teamIds.length % 2 !== 0) {
        for (const leg of Array.from({ length: legs }, (_, i) => i + 1)) {
            const legRounds = new Set(
                fixtures.filter((f) => f.leg === leg).map((f) => f.round)
            );

            if (legRounds.size !== roundsPerLeg) {
                throw new Error(`Leg ${leg} round count mismatch for odd team schedule.`);
            }
        }
    }

    return true;
}

module.exports = { validateSchedule };