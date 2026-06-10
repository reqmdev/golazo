const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    UserSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
} = require('discord.js');
const LeagueSettingsService = require('../../league/services/LeagueSettingsService');
const { buildDashboardShell } = require('../design/shell');
const { buildPanelChrome } = require('../design/context');
const { buildKeyValueTable } = require('../design/table');
const { buildDashboardBackRow } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { encodeDashboardId } = require('../ids');
const { DASHBOARD_VIEWS, SETTINGS_ACTIONS } = require('../constants');

/**
 * @param {object} input
 */
async function buildSettingsPanelPayload(input) {
    const { guildId, slug, member, userId, tr, guild } = input;
    const league = await LeagueSettingsService.getSettings(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });
    const emDash = tr('common.emDash');

    const actionRows = [];

    if (viewer.canManage) {
        actionRows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.SETTINGS, SETTINGS_ACTIONS.POINTS, slug))
                    .setLabel(tr('dashboard.settings.editPoints'))
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎯'),
            ),
            new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.SETTINGS, SETTINGS_ACTIONS.PERM_USER, slug))
                    .setPlaceholder(tr('dashboard.settings.pickUser'))
                    .setMinValues(1)
                    .setMaxValues(1),
            ),
            new ActionRowBuilder().addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.SETTINGS, SETTINGS_ACTIONS.CHANNEL, slug))
                    .setPlaceholder(tr('dashboard.settings.pickChannel'))
                    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                    .setMinValues(0)
                    .setMaxValues(1),
            ),
        );
    }

    return buildDashboardShell({
        ...buildPanelChrome({
            view: DASHBOARD_VIEWS.SETTINGS,
            tr,
            slug,
            guildName: guild?.name,
            league,
            footerRole: viewer.roleKey,
        }),
        bodyBuilder: () => buildKeyValueTable(
            [
                [
                    tr('dashboard.design.sections.points'),
                    tr('handlers.settings.show.points', {
                        win: league.settings.pointsWin,
                        draw: league.settings.pointsDraw,
                        loss: league.settings.pointsLoss,
                    }),
                ],
                [
                    tr('dashboard.design.sections.teams'),
                    tr('handlers.settings.show.teams', {
                        min: league.settings.minTeams,
                        max: league.settings.maxTeams,
                    }),
                ],
                [
                    tr('dashboard.design.sections.permissions'),
                    [
                        tr('handlers.settings.show.owner', { owner: `<@${league.permissions.ownerId}>` }),
                        tr('handlers.settings.show.admins', {
                            admins: (league.permissions.adminIds || []).map((id) => `<@${id}>`).join(', ') || emDash,
                        }),
                        tr('handlers.settings.show.scoreReporters', {
                            reporters: (league.permissions.scoreReporterIds || []).map((id) => `<@${id}>`).join(', ') || emDash,
                        }),
                    ].join(' · '),
                ],
                [
                    tr('dashboard.design.sections.announcements'),
                    tr('handlers.settings.show.announcements', {
                        channel: league.channels?.announcementsChannelId
                            ? `<#${league.channels.announcementsChannelId}>`
                            : emDash,
                    }),
                ],
            ],
            tr('dashboard.design.table.setting'),
            tr('dashboard.design.table.value'),
        ),
        actionRows,
        externalActionRows: [buildDashboardBackRow(tr, slug)],
    });
}

/**
 * @param {(key: string) => string} tr
 * @param {string} slug
 * @param {string} userId
 */
function buildPermissionActionRows(tr, slug, userId) {
    const roles = [
        { role: 'admin', addKey: 'dashboard.settings.addAdmin', removeKey: 'dashboard.settings.removeAdmin' },
        { role: 'scorer', addKey: 'dashboard.settings.addScorer', removeKey: 'dashboard.settings.removeScorer' },
    ];

    const buttons = [];

    for (const entry of roles) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(encodeDashboardId(
                    DASHBOARD_VIEWS.SETTINGS,
                    SETTINGS_ACTIONS.PERM_APPLY,
                    `${slug}|${userId}|${entry.role}|add`,
                ))
                .setLabel(tr(entry.addKey))
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(encodeDashboardId(
                    DASHBOARD_VIEWS.SETTINGS,
                    SETTINGS_ACTIONS.PERM_APPLY,
                    `${slug}|${userId}|${entry.role}|remove`,
                ))
                .setLabel(tr(entry.removeKey))
                .setStyle(ButtonStyle.Danger),
        );
    }

    return [new ActionRowBuilder().addComponents(...buttons)];
}

module.exports = {
    buildSettingsPanelPayload,
    buildPermissionActionRows,
};