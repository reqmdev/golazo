const { calculateGroupStandings } = require('../tournament/groupStandingCalculator');
const { isStandingsEligible } = require('../match/matchResult');
const { DEFAULT_FORFEIT_SCORE } = require('../constants/defaults');
const TeamRepository = require('../repositories/TeamRepository');
const MatchRepository = require('../repositories/MatchRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const TournamentStandingRepository = require('../repositories/TournamentStandingRepository');

/**
 * @param {string} tournamentId
 * @param {string} groupId
 * @param {object[]} matches
 * @param {string[]} [seedTeamIds]
 */
async function resolveTeamsForGroup(tournamentId, groupId, matches, seedTeamIds = []) {
    const teamIds = new Set(seedTeamIds.map((id) => id.toString()));

    const groupMatches = matches.filter(
        (m) => m.groupId === groupId && isStandingsEligible(m),
    );

    for (const match of groupMatches) {
        teamIds.add(match.homeTeamId.toString());
        teamIds.add(match.awayTeamId.toString());
    }

    const teams = await Promise.all(
        [...teamIds].map((id) => TeamRepository.findById(id)),
    );

    return teams.filter(Boolean);
}

const TournamentStandingService = {
    /**
     * @param {string} tournamentId
     * @param {string} groupId
     * @param {string} guildId
     * @param {object} league
     */
    recalculateGroup: async (tournamentId, groupId, guildId, league, session = null) => {
        const [matches, tournament] = await Promise.all([
            MatchRepository.listByTournament(tournamentId, { groupId }),
            TournamentRepository.findById(tournamentId),
        ]);

        const group = tournament?.groups?.find((entry) => entry.id === groupId);
        const seedTeamIds = group?.teamIds || [];
        const teams = await resolveTeamsForGroup(tournamentId, groupId, matches, seedTeamIds);

        const entries = calculateGroupStandings(
            teams,
            matches,
            {
                pointsWin: league.settings.pointsWin,
                pointsDraw: league.settings.pointsDraw,
                pointsLoss: league.settings.pointsLoss,
            },
            league.tiebreakers || [],
        );

        return TournamentStandingRepository.upsert(
            tournamentId,
            groupId,
            guildId,
            entries,
            session,
        );
    },

    /**
     * @param {string} tournamentId
     * @param {object} league
     * @param {{ updatedMatch: object }} input
     */
    updateAfterMatch: async (tournamentId, league, input, session = null) => {
        const groupId = input.updatedMatch.groupId;

        if (!groupId) {
            return null;
        }

        return TournamentStandingService.recalculateGroup(
            tournamentId,
            groupId,
            league.guildId,
            league,
            session,
        );
    },

    /**
     * @param {string} tournamentId
     */
    recalculateAllGroups: async (tournamentId, league, groups, session = null) => {
        const results = [];

        for (const group of groups) {
            const standing = await TournamentStandingService.recalculateGroup(
                tournamentId,
                group.id,
                league.guildId,
                league,
                session,
            );
            results.push({ groupId: group.id, standing });
        }

        return results;
    },

    /**
     * @param {string} tournamentId
     */
    getGroupStandings: async (tournamentId) =>
        TournamentStandingRepository.listByTournament(tournamentId),
};

module.exports = TournamentStandingService;
