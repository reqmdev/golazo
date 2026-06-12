const { KNOCKOUT_ROUND } = require('../constants/knockoutRound');
const { nextPowerOfTwo } = require('./formatResolver');

/**
 * @param {string} prefix
 * @param {number} slot
 */
function makeTieId(prefix, slot) {
    return `${prefix}-${slot}`;
}

/**
 * Build initial knockout bracket ties with bye support.
 *
 * @param {object} input
 * @param {string[]} input.teamIds ordered by seed (best first)
 * @param {string} input.round
 * @param {boolean} [input.twoLegged]
 */
function buildKnockoutBracket(input) {
    const { teamIds, round, twoLegged = true } = input;
    const bracketSize = nextPowerOfTwo(teamIds.length);
    const byeCount = bracketSize - teamIds.length;

    /** @type {object[]} */
    const ties = [];
    let slot = 0;

    /** @type {(string|null)[]} */
    const slots = new Array(bracketSize).fill(null);

    for (let i = 0; i < teamIds.length; i++) {
        slots[i] = teamIds[i];
    }

    for (let i = 0; i < bracketSize; i += 2) {
        const teamA = slots[i];
        const teamB = slots[i + 1];
        const tieId = makeTieId(round, slot);
        const isBye = Boolean(teamA && !teamB);

        ties.push({
            tieId,
            round,
            slot,
            teamAId: teamA,
            teamBId: teamB,
            winnerId: isBye ? teamA : null,
            isBye,
            twoLegged: isBye ? false : twoLegged,
        });

        slot += 1;
    }

    return ties;
}

/**
 * Build playoff bracket for 3-team format: seed2 vs seed3, seed1 waits for final.
 *
 * @param {object[]} qualifiedTeams sorted by seed
 */
function buildPlayoffBracket(qualifiedTeams) {
    const sorted = [...qualifiedTeams].sort((a, b) => a.seed - b.seed);

    if (sorted.length !== 3) {
        throw new Error('Playoff bracket requires exactly 3 teams');
    }

    return [
        {
            tieId: makeTieId(KNOCKOUT_ROUND.PLAYOFF, 0),
            round: KNOCKOUT_ROUND.PLAYOFF,
            slot: 0,
            teamAId: sorted[1].teamId.toString(),
            teamBId: sorted[2].teamId.toString(),
            winnerId: null,
            isBye: false,
            twoLegged: true,
            advancesTo: KNOCKOUT_ROUND.FINAL,
            awaitsSeed1: sorted[0].teamId.toString(),
        },
    ];
}

/**
 * Seed knockout bracket from group qualifiers (1st vs 2nd from different groups).
 *
 * @param {string[]} teamIds
 * @param {string} round
 */
function seedKnockoutFromGroups(teamIds, round) {
    /** @type {string[]} */
    const ordered = [...teamIds];

    if (ordered.length % 2 !== 0) {
        ordered.push(null);
    }

    /** @type {object[]} */
    const ties = [];
    const half = ordered.length / 2;

    for (let i = 0; i < half; i++) {
        const teamA = ordered[i];
        const teamB = ordered[ordered.length - 1 - i];
        const isBye = Boolean(teamA && !teamB);

        ties.push({
            tieId: makeTieId(round, i),
            round,
            slot: i,
            teamAId: teamA,
            teamBId: teamB,
            winnerId: isBye ? teamA : null,
            isBye,
            twoLegged: !isBye,
        });
    }

    return ties;
}

/**
 * Build next round ties from winners of current round.
 *
 * @param {object[]} completedTies
 * @param {string} nextRound
 */
function buildNextRoundTies(completedTies, nextRound) {
    const winners = completedTies
        .sort((a, b) => a.slot - b.slot)
        .map((tie) => tie.winnerId?.toString())
        .filter(Boolean);

    return buildKnockoutBracket({
        teamIds: winners,
        round: nextRound,
        twoLegged: nextRound !== KNOCKOUT_ROUND.FINAL,
    });
}

module.exports = {
    makeTieId,
    buildKnockoutBracket,
    buildPlayoffBracket,
    seedKnockoutFromGroups,
    buildNextRoundTies,
};
