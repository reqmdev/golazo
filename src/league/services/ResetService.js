const LeagueError = require('../errors/LeagueError');
const { AUDIT_ACTION } = require('../constants/auditAction');
const { LEAGUE_STATUS } = require('../constants/leagueStatus');
const PermissionService = require('./PermissionService');
const LeagueService = require('./LeagueService');
const AuditService = require('./AuditService');
const { invalidateLeagueRenderCache } = require('../discord/cacheInvalidation');
const LeagueRepository = require('../repositories/LeagueRepository');
const TeamRepository = require('../repositories/TeamRepository');
const MatchRepository = require('../repositories/MatchRepository');
const StandingRepository = require('../repositories/StandingRepository');
const { runWithTransaction } = require('../../database/transactions');

const ResetService = {
    /**
     * Wipe matches and standings, return league to registration (teams kept).
     *
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     */
    resetLeague: async (guildId, actorId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (league.status === LEAGUE_STATUS.ARCHIVED) {
            throw new LeagueError('LEAGUE_LOCKED_RESET');
        }

        const hadFixture = Boolean(league.fixtureGeneratedAt);
        const [matchesRemoved, teamCount] = await Promise.all([
            MatchRepository.countByLeague(league._id),
            TeamRepository.countActiveByLeague(league._id)
        ]);

        const update = {
            status: LEAGUE_STATUS.REGISTRATION,
            currentRound: 0,
            totalRounds: 0,
            fixtureGeneratedAt: null,
            fixtureVersion: 0
        };

        if (hadFixture) {
            update.season = (league.season || 1) + 1;
        }

        const updatedLeague = await runWithTransaction(async (session) => {
            await MatchRepository.deleteAllByLeague(league._id, session);
            await StandingRepository.deleteByLeague(league._id, session);
            return LeagueRepository.updateById(league._id, update, session);
        });

        invalidateLeagueRenderCache(league._id.toString());
        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.LEAGUE_RESET,
            summary: `League reset (${matchesRemoved} matches removed, ${teamCount} teams kept)`
        });

        return {
            league: updatedLeague,
            matchesRemoved,
            teamCount,
            hadFixture
        };
    }
};

module.exports = ResetService;