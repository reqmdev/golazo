const { buildLeagueSchedule, getTotalRounds } = require('../fixture/fixtureEngine');
const { COMPETITION_PHASE } = require('../fixture/constants');

/**
 * Build group-stage fixtures (double round-robin within each group).
 *
 * @param {object} input
 * @param {string} input.tournamentId
 * @param {string} input.leagueId
 * @param {string} input.guildId
 * @param {{ id: string, teamIds: string[] }[]} input.groups
 */
function buildGroupFixtures(input) {
    const { tournamentId, leagueId, guildId, groups } = input;
    /** @type {object[]} */
    const fixtures = [];
    let globalRound = 1;

    for (const group of groups) {
        if (group.teamIds.length < 2) {
            continue;
        }

        const schedule = buildLeagueSchedule(group.teamIds, {
            legs: 2,
            competitionPhase: COMPETITION_PHASE.CHAMPIONS_GROUP,
            groupId: group.id,
        });

        const roundsInGroup = getTotalRounds(group.teamIds.length, 2);

        for (const match of schedule) {
            fixtures.push({
                leagueId,
                guildId,
                tournamentId,
                round: match.round,
                leg: match.leg,
                competitionPhase: match.competitionPhase,
                groupId: match.groupId,
                pairingKey: match.pairingKey,
                homeTeamId: match.homeTeamId,
                awayTeamId: match.awayTeamId,
                status: 'scheduled',
            });
        }

        globalRound += roundsInGroup;
    }

    return fixtures;
}

/**
 * @param {{ id: string, teamIds: string[] }[]} groups
 */
function getMaxGroupRounds(groups) {
    let max = 0;

    for (const group of groups) {
        if (group.teamIds.length >= 2) {
            max = Math.max(max, getTotalRounds(group.teamIds.length, { legs: 2 }));
        }
    }

    return max;
}

module.exports = {
    buildGroupFixtures,
    getMaxGroupRounds,
};
