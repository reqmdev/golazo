const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const LeagueService = require('../../league/services/LeagueService');
const TeamService = require('../../league/services/TeamService');
const TeamRepository = require('../../league/repositories/TeamRepository');
const { buildTeamListShowPayload } = require('../../league/discord/teamListNav');
const { stripLeagueReplyMeta } = require('../../league/utils/visualV2Reply');
const { buildDashboardShell, wrapVisualPanel } = require('../design/shell');
const { buildPanelChrome } = require('../design/context');
const { buildDashboardBackRow } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { encodeDashboardId } = require('../ids');
const { DASHBOARD_VIEWS, TEAM_ACTIONS } = require('../constants');

/**
 * @param {object} input
 */
function buildTeamsActionRow(input) {
    const { tr, slug, viewer } = input;

    if (!viewer.canManage) {
        return null;
    }

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.TEAMS, TEAM_ACTIONS.ADD, slug))
            .setLabel(tr('dashboard.teams.add'))
            .setStyle(ButtonStyle.Success)
            .setEmoji('➕'),
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.TEAMS, TEAM_ACTIONS.REMOVE, slug))
            .setLabel(tr('dashboard.teams.remove'))
            .setStyle(ButtonStyle.Danger)
            .setEmoji('➖'),
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.TEAMS, TEAM_ACTIONS.BULK_ADD, slug))
            .setLabel(tr('dashboard.teams.bulkAdd'))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📥'),
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.TEAMS, TEAM_ACTIONS.EDIT, slug))
            .setLabel(tr('dashboard.teams.edit'))
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✏️'),
    );
}

/**
 * @param {object} input
 */
async function buildTeamsPanelPayload(input) {
    const {
        guildId,
        slug,
        locale,
        tr,
        client,
        guild,
        member,
        userId,
        page = 1,
    } = input;

    const league = await LeagueService.resolveLeague(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });
    const teams = await TeamService.listTeams(guildId, slug);
    const teamCount = await TeamRepository.countActiveByLeague(league._id);
    const teamsRow = buildTeamsActionRow({ tr, slug, viewer });
    const extraRows = [];

    if (teamsRow) {
        extraRows.push(teamsRow);

        if (!league.fixtureGeneratedAt && teams.length >= (league.settings?.minTeams ?? 2)) {
            extraRows.push(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.TEAMS, TEAM_ACTIONS.GENERATE, slug))
                        .setLabel(tr('dashboard.teams.generate'))
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📅'),
                ),
            );
        }
    }

    const chrome = buildPanelChrome({
        view: DASHBOARD_VIEWS.TEAMS,
        tr,
        slug,
        guildName: guild?.name,
        league,
        teamCount,
        footerRole: viewer.roleKey,
        hint: teams.length === 0 ? tr('handlers.team.list.empty', { slug }) : undefined,
        hintTone: 'warning',
    });

    if (teams.length === 0) {
        return buildDashboardShell({
            ...chrome,
            actionRows: extraRows,
            externalActionRows: [buildDashboardBackRow(tr, slug)],
        });
    }

    const payload = await buildTeamListShowPayload({
        guildId,
        slug,
        page,
        locale,
        tr,
        client,
        guild,
    });

    return wrapVisualPanel({
        chrome,
        leaguePayload: stripLeagueReplyMeta(payload),
        prependRows: extraRows,
        backRow: buildDashboardBackRow(tr, slug),
    });
}

module.exports = {
    buildTeamsPanelPayload,
    buildTeamsActionRow,
};