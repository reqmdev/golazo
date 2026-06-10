const { calculateStandings } = require('../algorithms/standingCalculator');
const {
    incrementalStandingsUpdate,
    isIncrementalStandingsEnabled
} = require('../algorithms/incrementalStandings');
const { isStandingsEligible } = require('../match/matchResult');
const { DEFAULT_FORFEIT_SCORE } = require('../constants/defaults');
const { incrementCounter } = require('../../metrics/registry');
const LeagueService = require('./LeagueService');
const TeamRepository = require('../repositories/TeamRepository');
const MatchRepository = require('../repositories/MatchRepository');
const StandingRepository = require('../repositories/StandingRepository');

/**
 * Build team list for standings: active teams plus any referenced by eligible matches.
 *
 * @param {import('mongoose').Types.ObjectId | string} leagueId
 * @param {object[]} matches
 */
async function resolveTeamsForStandings(leagueId, matches) {
    const [activeTeams, allTeams] = await Promise.all([
        TeamRepository.listActiveByLeague(leagueId),
        TeamRepository.listByLeague(leagueId)
    ]);

    const teamById = new Map(allTeams.map((team) => [team._id.toString(), team]));
    const merged = new Map(activeTeams.map((team) => [team._id.toString(), team]));

    for (const match of matches) {
        if (!isStandingsEligible(match)) {
            continue;
        }

        const homeId = match.homeTeamId.toString();
        const awayId = match.awayTeamId.toString();

        if (teamById.has(homeId) && !merged.has(homeId)) {
            merged.set(homeId, teamById.get(homeId));
        }

        if (teamById.has(awayId) && !merged.has(awayId)) {
            merged.set(awayId, teamById.get(awayId));
        }
    }

    return [...merged.values()];
}

const StandingService = {
    /**
     * Full rebuild from source matches — score corrections automatically rollback prior state.
     *
     * @param {import('mongoose').Types.ObjectId | string} leagueId
     * @param {object} league
     */
    recalculate: async (leagueId, league, session = null) => {
        const [matches, existing] = await Promise.all([
            MatchRepository.listByLeague(leagueId, {}, session),
            StandingRepository.findByLeague(leagueId, session)
        ]);

        const teams = await resolveTeamsForStandings(leagueId, matches);

        const entries = calculateStandings(
            teams,
            matches,
            {
                pointsWin: league.settings.pointsWin,
                pointsDraw: league.settings.pointsDraw,
                pointsLoss: league.settings.pointsLoss
            },
            league.tiebreakers || [],
            DEFAULT_FORFEIT_SCORE
        );

        const version = (existing?.version || 0) + 1;

        return StandingRepository.upsert(leagueId, league.guildId, entries, version, session);
    },

    /**
     * Prefer incremental update after a single match change; fall back to full rebuild.
     *
     * @param {import('mongoose').Types.ObjectId | string} leagueId
     * @param {object} league
     * @param {{ updatedMatch: object, previousMatch?: object | null }} input
     */
    updateAfterMatch: async (leagueId, league, input, session = null) => {
        if (!isIncrementalStandingsEnabled()) {
            return StandingService.recalculate(leagueId, league, session);
        }

        const [matches, existing] = await Promise.all([
            MatchRepository.listByLeague(leagueId, {}, session),
            StandingRepository.findByLeague(leagueId, session)
        ]);

        if (!existing?.entries?.length) {
            incrementCounter('golazo_standings_full_rebuild_total');
            return StandingService.recalculate(leagueId, league, session);
        }

        const entries = incrementalStandingsUpdate(
            existing.entries,
            input.updatedMatch,
            input.previousMatch || null,
            matches,
            league,
            DEFAULT_FORFEIT_SCORE
        );

        if (!entries) {
            incrementCounter('golazo_standings_full_rebuild_total');
            return StandingService.recalculate(leagueId, league, session);
        }

        incrementCounter('golazo_standings_incremental_total');
        const version = (existing.version || 0) + 1;
        return StandingRepository.upsert(leagueId, league.guildId, entries, version, session);
    },

    /**
     * Rebuild standings from matches (invalid/corrupt materialized state recovery).
     *
     * @param {string} guildId
     * @param {string} leagueSlug
     */
    recoverStandings: async (guildId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        return StandingService.recalculate(league._id, league);
    },

    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     */
    getStandings: async (guildId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);

        if (!league.fixtureGeneratedAt) {
            return { league, standing: null, teams: [], teamMap: new Map() };
        }

        const [standing, teams] = await Promise.all([
            StandingRepository.findByLeague(league._id),
            TeamRepository.listActiveByLeague(league._id)
        ]);

        const teamMap = new Map(teams.map((team) => [team._id.toString(), team]));

        return { league, standing, teams, teamMap };
    }
};

module.exports = StandingService;