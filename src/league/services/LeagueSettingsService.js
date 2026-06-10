const LeagueError = require('../errors/LeagueError');
const { AUDIT_ACTION } = require('../constants/auditAction');
const { FIXTURE_LOCK_STATUSES } = require('../fixture/constants');
const PermissionService = require('./PermissionService');
const LeagueService = require('./LeagueService');
const AuditService = require('./AuditService');
const LeagueRepository = require('../repositories/LeagueRepository');
const MatchRepository = require('../repositories/MatchRepository');

/**
 * @param {object} league
 */
async function assertNoLockedResults(league) {
    const locked = await MatchRepository.countByLeagueWithStatuses(league._id, FIXTURE_LOCK_STATUSES);

    if (locked > 0) {
        throw new LeagueError('SETTINGS_LOCKED');
    }
}

/**
 * @param {number} value
 * @param {string} label
 */
function assertPointsValue(value, label) {
    if (!Number.isInteger(value) || value < 0 || value > 20) {
        throw new LeagueError('INVALID_POINTS_LABEL', { label });
    }
}

const LeagueSettingsService = {
    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     */
    getSettings: async (guildId, leagueSlug) => {
        return LeagueService.resolveLeague(guildId, leagueSlug);
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {{ pointsWin?: number, pointsDraw?: number, pointsLoss?: number }} input
     */
    updatePoints: async (guildId, actorId, leagueSlug, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);
        await assertNoLockedResults(league);

        const hasUpdate = input.pointsWin !== undefined
            || input.pointsDraw !== undefined
            || input.pointsLoss !== undefined;

        if (!hasUpdate) {
            throw new LeagueError('INVALID_POINTS_EMPTY');
        }

        const lockedCount = await MatchRepository.countByLeagueWithStatuses(league._id, FIXTURE_LOCK_STATUSES);

        if (lockedCount > 0) {
            throw new LeagueError('SETTINGS_LOCKED');
        }

        const settings = { ...league.settings };

        if (input.pointsWin !== undefined) {
            assertPointsValue(input.pointsWin, 'Win points');
            settings.pointsWin = input.pointsWin;
        }

        if (input.pointsDraw !== undefined) {
            assertPointsValue(input.pointsDraw, 'Draw points');
            settings.pointsDraw = input.pointsDraw;
        }

        if (input.pointsLoss !== undefined) {
            assertPointsValue(input.pointsLoss, 'Loss points');
            settings.pointsLoss = input.pointsLoss;
        }

        const updated = await LeagueRepository.updateById(league._id, { settings });

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.SETTINGS_UPDATE,
            summary: `Points updated to ${settings.pointsWin}/${settings.pointsDraw}/${settings.pointsLoss}`,
            metadata: { settings }
        });

        return updated;
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {string} userId
     * @param {'admin' | 'scorer'} role
     * @param {'add' | 'remove'} action
     */
    updatePermission: async (guildId, actorId, leagueSlug, userId, role, action) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);

        if (!userId) {
            throw new LeagueError('INVALID_USER');
        }

        if (role === 'admin') {
            if (!PermissionService.isOwner(league, actorId)) {
                throw new LeagueError('PERMISSION_DENIED_ADMIN');
            }

            if (userId === league.permissions.ownerId) {
                throw new LeagueError('INVALID_USER_OWNER');
            }
        } else {
            PermissionService.assertCanManageLeague(league, actorId);
        }

        const field = role === 'admin' ? 'permissions.adminIds' : 'permissions.scoreReporterIds';
        const operator = action === 'add' ? '$addToSet' : '$pull';

        const updated = await LeagueRepository.updateWithOperators(league._id, {
            [operator]: { [field]: userId }
        });

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.PERMISSIONS_UPDATE,
            summary: `${action === 'add' ? 'Added' : 'Removed'} ${role} <@${userId}>`,
            metadata: { role, action, userId }
        });

        return updated;
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {string | null} channelId
     */
    setAnnouncementsChannel: async (guildId, actorId, leagueSlug, channelId) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        const updated = await LeagueRepository.updateById(league._id, {
            channels: {
                ...league.channels,
                announcementsChannelId: channelId
            }
        });

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.SETTINGS_UPDATE,
            summary: channelId
                ? `Announcements channel set to <#${channelId}>`
                : 'Announcements channel cleared',
            metadata: { channelId }
        });

        return updated;
    }
};

module.exports = LeagueSettingsService;