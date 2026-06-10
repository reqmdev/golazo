const LeagueError = require('../errors/LeagueError');
const { AUDIT_ACTION } = require('../constants/auditAction');
const PermissionService = require('./PermissionService');
const LeagueService = require('./LeagueService');
const StandingService = require('./StandingService');
const AuditService = require('./AuditService');
const { invalidateLeagueRenderCache } = require('../discord/cacheInvalidation');

const RollbackService = {
    /**
     * Full standings rebuild from source matches (invalid state recovery).
     *
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     */
    recoverStandings: async (guildId, actorId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (!league.fixtureGeneratedAt) {
            throw new LeagueError('NO_FIXTURE_ROLLBACK');
        }

        const standing = await StandingService.recoverStandings(guildId, leagueSlug);
        invalidateLeagueRenderCache(league._id.toString());

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.STANDINGS_RECOVER,
            summary: `Standings rebuilt from matches (v${standing.version})`,
            metadata: { version: standing.version }
        });

        return { league, standing };
    }
};

module.exports = RollbackService;