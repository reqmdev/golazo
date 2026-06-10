const { PermissionFlagsBits } = require('discord.js');
const PermissionService = require('../league/services/PermissionService');

/**
 * @param {import('discord.js').GuildMember | import('discord.js').APIInteractionGuildMember | null} member
 */
function hasManageGuild(member) {
    if (!member || !('permissions' in member)) {
        return false;
    }

    const permissions = member.permissions;

    if (typeof permissions === 'string') {
        return (BigInt(permissions) & PermissionFlagsBits.ManageGuild) === PermissionFlagsBits.ManageGuild;
    }

    return permissions.has(PermissionFlagsBits.ManageGuild);
}

/**
 * @param {object} input
 * @param {import('discord.js').GuildMember | import('discord.js').APIInteractionGuildMember | null} input.member
 * @param {string} input.userId
 * @param {object | null} [input.league]
 */
function buildViewerContext(input) {
    const { member, userId, league = null } = input;
    const canManageGuild = hasManageGuild(member);

    if (!league) {
        return {
            canManageGuild,
            isOwner: false,
            isAdmin: false,
            canReportScore: false,
            canManage: false,
            roleKey: canManageGuild ? 'dashboard.roles.manager' : 'dashboard.roles.viewer',
        };
    }

    const isOwner = PermissionService.isOwner(league, userId);
    const isAdmin = PermissionService.isAdmin(league, userId);
    const canReportScore = PermissionService.canReportScore(league, userId);
    const canManage = isAdmin;

    let roleKey = 'dashboard.roles.viewer';

    if (isOwner) {
        roleKey = 'dashboard.roles.owner';
    } else if (isAdmin) {
        roleKey = 'dashboard.roles.admin';
    } else if (canReportScore) {
        roleKey = 'dashboard.roles.scorer';
    }

    return {
        canManageGuild,
        isOwner,
        isAdmin,
        canReportScore,
        canManage,
        roleKey,
    };
}

module.exports = {
    hasManageGuild,
    buildViewerContext,
};