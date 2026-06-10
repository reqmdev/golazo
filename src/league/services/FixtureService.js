const LeagueError = require('../errors/LeagueError');
const { LEAGUE_STATUS } = require('../constants/leagueStatus');
const { LEAGUE_FORMAT } = require('../constants/leagueFormat');
const { MATCH_STATUS } = require('../constants/matchStatus');
const { FIXTURE_LOCK_STATUSES, FIXTURE_REMOVABLE_STATUSES } = require('../fixture/constants');
const { buildLeagueSchedule, getTotalRounds, normalizeTeamIds } = require('../fixture/fixtureEngine');
const { AUDIT_ACTION } = require('../constants/auditAction');
const PermissionService = require('./PermissionService');
const LeagueService = require('./LeagueService');
const AuditService = require('./AuditService');
const StandingService = require('./StandingService');
const { invalidateLeagueRenderCache } = require('../discord/cacheInvalidation');
const LeagueRepository = require('../repositories/LeagueRepository');
const TeamRepository = require('../repositories/TeamRepository');
const MatchRepository = require('../repositories/MatchRepository');
const { runWithTransaction, supportsTransactions } = require('../../database/transactions');

/**
 * @param {object} league
 */
async function assertRegenerationAllowed(league) {
    if ([LEAGUE_STATUS.COMPLETED, LEAGUE_STATUS.ARCHIVED].includes(league.status)) {
        throw new LeagueError('LEAGUE_LOCKED_FIXTURE');
    }

    const lockedCount = await MatchRepository.countByLeagueWithStatuses(league._id, FIXTURE_LOCK_STATUSES);

    if (lockedCount > 0) {
        throw new LeagueError('FIXTURE_LOCKED');
    }
}

/**
 * @param {object} league
 * @param {object[]} teams
 * @param {string} guildId
 */
async function persistFixture(league, teams, guildId, { isRegeneration = false } = {}) {
    const teamCount = teams.length;
    const legs = league.format === LEAGUE_FORMAT.DOUBLE_ROUND_ROBIN ? 2 : 1;
    const teamIds = normalizeTeamIds(teams.map((team) => team._id));
    const schedule = buildLeagueSchedule(teamIds, { legs });

    if (schedule.length === 0) {
        throw new LeagueError('FIXTURE_FAILED');
    }

    if (isRegeneration) {
        await assertRegenerationAllowed(league);
    }

    const matchDocs = schedule.map((entry) => ({
        leagueId: league._id,
        guildId,
        round: entry.round,
        leg: entry.leg,
        homeTeamId: entry.homeTeamId,
        awayTeamId: entry.awayTeamId,
        competitionPhase: entry.competitionPhase,
        groupId: entry.groupId,
        pairingKey: entry.pairingKey,
        status: MATCH_STATUS.SCHEDULED
    }));

    const totalRounds = getTotalRounds(teamCount, { legs });
    const nextVersion = (league.fixtureVersion || 0) + 1;
    const leagueUpdate = {
        fixtureGeneratedAt: new Date(),
        fixtureVersion: nextVersion,
        totalRounds,
        currentRound: 1,
        status: LEAGUE_STATUS.ACTIVE
    };

    /** @type {object[] | null} */
    let removableBackup = null;

    if (isRegeneration) {
        removableBackup = await MatchRepository.listByLeagueWithStatuses(
            league._id,
            FIXTURE_REMOVABLE_STATUSES
        );
    }

    try {
        const updatedLeague = await runWithTransaction(async (session) => {
            if (isRegeneration) {
                await MatchRepository.deleteByLeagueWithStatuses(
                    league._id,
                    FIXTURE_REMOVABLE_STATUSES,
                    session
                );
            }

            await MatchRepository.bulkInsert(matchDocs, session);

            return LeagueRepository.updateById(league._id, leagueUpdate, session);
        });

        return {
            league: updatedLeague,
            matchCount: matchDocs.length,
            totalRounds,
            teamCount,
            byeRounds: schedule
                .filter((entry) => entry.byeTeamIds.length > 0)
                .map((entry) => ({ round: entry.round, leg: entry.leg, teamId: entry.byeTeamIds[0] }))
        };
    } catch (err) {
        if (removableBackup?.length && !(await supportsTransactions())) {
            try {
                await MatchRepository.bulkInsert(removableBackup);
            } catch (restoreErr) {
                console.error('[golazo] fixture compensation restore failed:', restoreErr?.message || restoreErr);
            }
        }

        throw err;
    }
}

const FixtureService = {
    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     */
    generateFixture: async (guildId, actorId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (league.fixtureGeneratedAt) {
            throw new LeagueError('FIXTURE_EXISTS_ALREADY');
        }

        const existingMatches = await MatchRepository.countByLeague(league._id);

        if (existingMatches > 0) {
            throw new LeagueError('FIXTURE_EXISTS_MATCHES');
        }

        const teams = await TeamRepository.listActiveByLeague(league._id);

        if (teams.length < league.settings.minTeams) {
            throw new LeagueError('NOT_ENOUGH_TEAMS', {
                min: league.settings.minTeams,
                count: teams.length
            });
        }

        if (teams.length > league.settings.maxTeams) {
            throw new LeagueError('TEAM_LIMIT_FIXTURE_GENERATE', {
                count: teams.length,
                max: league.settings.maxTeams
            });
        }

        const result = await persistFixture(league, teams, guildId);

        invalidateLeagueRenderCache(league._id.toString());
        await AuditService.record({
            leagueId: result.league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.FIXTURE_GENERATE,
            summary: `Fixture generated (${result.matchCount} matches, ${result.totalRounds} rounds)`
        });

        return result;
    },

    /**
     * Safely rebuild fixtures when no locked match results exist.
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     */
    regenerateFixture: async (guildId, actorId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (!league.fixtureGeneratedAt) {
            throw new LeagueError('NO_FIXTURE_GENERATE');
        }

        await assertRegenerationAllowed(league);

        const teams = await TeamRepository.listActiveByLeague(league._id);

        if (teams.length < league.settings.minTeams) {
            throw new LeagueError('NOT_ENOUGH_TEAMS', {
                min: league.settings.minTeams,
                count: teams.length
            });
        }

        if (teams.length > league.settings.maxTeams) {
            throw new LeagueError('TEAM_LIMIT_FIXTURE_REGENERATE', {
                count: teams.length,
                max: league.settings.maxTeams
            });
        }

        const result = await persistFixture(league, teams, guildId, { isRegeneration: true });

        await StandingService.recalculate(result.league._id, result.league);
        invalidateLeagueRenderCache(league._id.toString());
        await AuditService.record({
            leagueId: result.league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.FIXTURE_REGENERATE,
            summary: `Fixture regenerated (v${result.league.fixtureVersion})`
        });

        return result;
    },

    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     * @param {number | null} round
     */
    getFixture: async (guildId, leagueSlug, round = null) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);

        if (!league.fixtureGeneratedAt) {
            throw new LeagueError('NO_FIXTURE_VIEW');
        }

        const targetRound = round ?? league.currentRound ?? 1;

        if (targetRound < 1 || (league.totalRounds > 0 && targetRound > league.totalRounds)) {
            throw new LeagueError('INVALID_ROUND', { totalRounds: league.totalRounds });
        }

        const [matches, teams] = await Promise.all([
            MatchRepository.findByLeagueAndRound(league._id, targetRound),
            TeamRepository.listActiveByLeague(league._id)
        ]);

        const teamMap = new Map(teams.map((team) => [team._id.toString(), team]));

        // Derive bye teams for this round from active teams not playing.
        const playingIds = new Set();

        for (const match of matches) {
            playingIds.add(match.homeTeamId.toString());
            playingIds.add(match.awayTeamId.toString());
        }

        const byeTeams = teams
            .filter((team) => !playingIds.has(team._id.toString()))
            .map((team) => team.name);

        return {
            league,
            round: targetRound,
            matches,
            teamMap,
            byeTeams
        };
    },

    /**
     * Generate fixture without permission checks (admin/dev tooling only).
     *
     * @param {string} guildId
     * @param {string} leagueSlug
     */
    generateFixtureUnchecked: async (guildId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);

        if (league.fixtureGeneratedAt) {
            throw new LeagueError('FIXTURE_EXISTS_ALREADY');
        }

        const teams = await TeamRepository.listActiveByLeague(league._id);

        if (teams.length < league.settings.minTeams) {
            throw new LeagueError('NOT_ENOUGH_TEAMS', {
                min: league.settings.minTeams,
                count: teams.length
            });
        }

        const result = await persistFixture(league, teams, guildId);

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId: 'admin',
            action: AUDIT_ACTION.FIXTURE_GENERATE,
            summary: `Admin fixture generated (${result.matchCount} matches)`
        });

        invalidateLeagueRenderCache(league._id.toString());

        return result;
    }
};

module.exports = FixtureService;