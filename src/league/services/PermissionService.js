const LeagueError = require('../errors/LeagueError');

const PermissionService = {
    /**
     * @param {{ permissions: { ownerId: string, adminIds?: string[] } }} league
     * @param {string} userId
     */
    isOwner: (league, userId) => league.permissions.ownerId === userId,

    /**
     * @param {{ permissions: { ownerId: string, adminIds?: string[] } }} league
     * @param {string} userId
     */
    isAdmin: (league, userId) => {
        if (PermissionService.isOwner(league, userId)) return true;
        return (league.permissions.adminIds || []).includes(userId);
    },

    /**
     * @param {{ permissions: { ownerId: string, adminIds?: string[] } }} league
     * @param {string} userId
     */
    assertCanManageLeague: (league, userId) => {
        if (!PermissionService.isAdmin(league, userId)) {
            throw new LeagueError('PERMISSION_DENIED_MANAGE');
        }
    },

    /**
     * @param {{ permissions: { ownerId: string, adminIds?: string[], scoreReporterIds?: string[] } }} league
     * @param {string} userId
     */
    canReportScore: (league, userId) => {
        if (PermissionService.isAdmin(league, userId)) return true;
        return (league.permissions.scoreReporterIds || []).includes(userId);
    },

    /**
     * @param {{ permissions: { ownerId: string, adminIds?: string[], scoreReporterIds?: string[] } }} league
     * @param {string} userId
     */
    assertCanReportScore: (league, userId) => {
        if (!PermissionService.canReportScore(league, userId)) {
            throw new LeagueError('PERMISSION_DENIED_SCORE');
        }
    }
};

module.exports = PermissionService;