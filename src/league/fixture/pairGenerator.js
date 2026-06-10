const { BYE } = require('./constants');

/**
 * Berger table (circle method) — unordered pairs in circle order (not sorted).
 * Input team IDs MUST be pre-sorted for deterministic output.
 *
 * @param {string[]} sortedTeamIds
 * @returns {{ round: number, pairs: [string, string][], byeTeamId: string | null }[]}
 */
function generatePairRounds(sortedTeamIds) {
    if (!Array.isArray(sortedTeamIds) || sortedTeamIds.length < 2) {
        return [];
    }

    const slots = sortedTeamIds.map((id) => id.toString());

    if (slots.length % 2 !== 0) {
        slots.push(BYE);
    }

    const slotCount = slots.length;
    const roundsPerLeg = slotCount - 1;
    const half = slotCount / 2;
    const fixed = slots[0];
    const rotating = slots.slice(1);
    const rounds = [];

    for (let roundIndex = 0; roundIndex < roundsPerLeg; roundIndex++) {
        const roundTeams = [fixed, ...rotating];
        const pairs = [];
        let byeTeamId = null;

        for (let i = 0; i < half; i++) {
            const teamA = roundTeams[i];
            const teamB = roundTeams[slotCount - 1 - i];

            if (teamA === BYE) {
                byeTeamId = teamB;
                continue;
            }

            if (teamB === BYE) {
                byeTeamId = teamA;
                continue;
            }

            pairs.push([teamA, teamB]);
        }

        rounds.push({
            round: roundIndex + 1,
            pairs,
            byeTeamId
        });

        rotating.unshift(rotating.pop());
    }

    return rounds;
}

/**
 * @param {number} teamCount
 * @returns {number}
 */
function getRoundsPerLeg(teamCount) {
    if (teamCount < 2) {
        return 0;
    }

    const effectiveSlots = teamCount % 2 === 0 ? teamCount : teamCount + 1;
    return effectiveSlots - 1;
}

module.exports = { generatePairRounds, getRoundsPerLeg, BYE };