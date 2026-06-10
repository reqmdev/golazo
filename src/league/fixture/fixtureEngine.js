const { COMPETITION_PHASE } = require('./constants');
const { pairingKey } = require('./pairingKey');
const { generatePairRounds, getRoundsPerLeg } = require('./pairGenerator');
const { assignVenuesForLeg } = require('./venueAssigner');
const { validateSchedule } = require('./scheduleValidator');

/**
 * Normalize and sort team IDs for deterministic generation.
 * @param {string[] | import('mongoose').Types.ObjectId[]} teamIds
 * @returns {string[]}
 */
function normalizeTeamIds(teamIds) {
    return [...teamIds].map((id) => id.toString()).sort((a, b) => a.localeCompare(b));
}

/**
 * Build a full league round-robin schedule.
 *
 * @param {string[] | import('mongoose').Types.ObjectId[]} teamIds
 * @param {{ legs?: 1 | 2, competitionPhase?: string, groupId?: string | null }} options
 * @returns {{
 *   round: number,
 *   leg: number,
 *   homeTeamId: string,
 *   awayTeamId: string,
 *   byeTeamIds: string[],
 *   competitionPhase: string,
 *   groupId: string | null,
 *   pairingKey: string
 * }[]}
 */
function buildLeagueSchedule(teamIds, options = {}) {
    const legs = options.legs === 2 ? 2 : 1;
    const competitionPhase = options.competitionPhase || COMPETITION_PHASE.LEAGUE;
    const groupId = options.groupId ?? null;
    const sorted = normalizeTeamIds(teamIds);

    if (sorted.length < 2) {
        return [];
    }

    const pairRounds = generatePairRounds(sorted);
    const roundsPerLeg = getRoundsPerLeg(sorted.length);
    const legAssignments = assignVenuesForLeg(pairRounds, sorted);
    const byeByRound = new Map(pairRounds.map((round) => [round.round, round.byeTeamId]));
    const legOne = legAssignments.map((match) => ({
        round: match.round,
        leg: 1,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        byeTeamIds: byeByRound.get(match.round) ? [byeByRound.get(match.round)] : [],
        competitionPhase,
        groupId,
        pairingKey: pairingKey(match.homeTeamId, match.awayTeamId)
    }));

    const fixtures = [...legOne];

    if (legs === 2) {
        for (const match of legOne) {
            fixtures.push({
                round: match.round + roundsPerLeg,
                leg: 2,
                homeTeamId: match.awayTeamId,
                awayTeamId: match.homeTeamId,
                byeTeamIds: match.byeTeamIds,
                competitionPhase,
                groupId,
                pairingKey: match.pairingKey
            });
        }
    }

    validateSchedule(fixtures, sorted, legs);

    return fixtures;
}

/**
 * @param {number} teamCount
 * @param {{ legs?: 1 | 2 }} options
 * @returns {number}
 */
function getTotalRounds(teamCount, options = {}) {
    const legs = options.legs === 2 ? 2 : 1;
    return getRoundsPerLeg(teamCount) * legs;
}

/**
 * @param {number} teamCount
 * @param {{ legs?: 1 | 2 }} options
 * @returns {number}
 */
function getExpectedMatchCount(teamCount, options = {}) {
    const legs = options.legs === 2 ? 2 : 1;

    if (teamCount < 2) {
        return 0;
    }

    return ((teamCount * (teamCount - 1)) / 2) * legs;
}

module.exports = {
    buildLeagueSchedule,
    getTotalRounds,
    getExpectedMatchCount,
    normalizeTeamIds
};