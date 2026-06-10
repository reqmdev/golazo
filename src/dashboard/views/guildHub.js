const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const LeagueService = require('../../league/services/LeagueService');
const { MAX_LEAGUES_PER_GUILD } = require('../../league/constants/defaults');
const { buildDashboardShell } = require('../design/shell');
const { buildViewerContext } = require('../permissions');
const { encodeDashboardId } = require('../ids');
const { DASHBOARD_VIEWS, HUB_ACTIONS } = require('../constants');
const { statusEmoji } = require('../design/context');
const { buildTable } = require('../design/table');
const { clipV2Text } = require('../../ui/ComponentsV2Factory');

/**
 * @param {object[]} leagues
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 */
function buildLeagueTable(leagues, tr, budget) {
    const columns = [
        { header: tr('dashboard.design.table.status'), maxWidth: 6, minWidth: 2 },
        { header: tr('dashboard.design.table.name'), maxWidth: 24 },
        { header: tr('dashboard.design.table.slug'), maxWidth: 16 },
        { header: tr('dashboard.design.table.round'), maxWidth: 14 },
    ];

    const rows = leagues.slice(0, 10).map((league) => {
        const round = league.fixtureGeneratedAt
            ? tr('dashboard.hub.leagueRound', {
                round: league.currentRound || 1,
                total: league.totalRounds || '?',
            })
            : tr('dashboard.hub.leagueNoFixture');

        return [
            statusEmoji(league.status),
            league.name,
            league.slug,
            round,
        ];
    });

    const emoji = budget.takeCandidate(['🏆', { key: 'league' }]);
    const sectionTitle = emoji
        ? `${emoji} ${tr('dashboard.design.sections.leagues')}`
        : tr('dashboard.design.sections.leagues');
    const countLine = `${leagues.length}/${MAX_LEAGUES_PER_GUILD} ${tr('dashboard.design.stats.leagues')}`;
    const titleLine = `${sectionTitle}  ·  ${countLine}`;

    return buildTable(columns, rows, { titleLine });
}

/**
 * @param {object[]} leagues
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 * @param {import('../design/layout').EmojiBudget} budget
 */
function buildHubLeagueContent(leagues, tr, budget) {
    if (leagues.length > 0) {
        return buildLeagueTable(leagues, tr, budget);
    }

    return clipV2Text(`${leagues.length}/${MAX_LEAGUES_PER_GUILD} ${tr('dashboard.design.stats.leagues')}`);
}

/**
 * @param {object} input
 */
async function buildGuildHubPayload(input) {
    const { guild, member, userId, tr } = input;
    const viewer = buildViewerContext({ member, userId });
    const leagues = await LeagueService.listLeagues(guild.id);

    const actionRows = [];

    if (leagues.length > 0) {
        const select = new StringSelectMenuBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.HUB, HUB_ACTIONS.LEAGUE_SELECT))
            .setPlaceholder(tr('dashboard.hub.selectLeague'))
            .addOptions(
                leagues.slice(0, 25).map((league) => {
                    const status = tr(`dashboard.league.status.${league.status}`, { status: league.status });
                    const round = league.fixtureGeneratedAt
                        ? tr('dashboard.hub.leagueRound', {
                            round: league.currentRound || 1,
                            total: league.totalRounds || '?',
                        })
                        : tr('dashboard.hub.leagueNoFixture');

                    return {
                        label: league.name.slice(0, 100),
                        description: `${status} · ${round}`.slice(0, 100),
                        value: league.slug,
                        emoji: statusEmoji(league.status),
                    };
                }),
            );

        actionRows.push(new ActionRowBuilder().addComponents(select));
    }

    if (viewer.canManageGuild && leagues.length < MAX_LEAGUES_PER_GUILD) {
        actionRows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.HUB, HUB_ACTIONS.CREATE))
                    .setLabel(tr('dashboard.hub.create'))
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('➕'),
            ),
        );
    }

    return buildDashboardShell({
        view: DASHBOARD_VIEWS.HUB,
        tr,
        title: tr('dashboard.hub.title'),
        bodyBuilder: (budget) => buildHubLeagueContent(leagues, tr, budget),
        hint: leagues.length === 0
            ? tr('dashboard.hub.empty')
            : tr('dashboard.design.callout.hubHint'),
        hintTone: leagues.length === 0 ? 'warning' : 'info',
        footerRole: viewer.roleKey,
        actionRows,
        skipContentSeparator: true,
    });
}

module.exports = {
    buildGuildHubPayload,
    buildLeagueTable,
    buildHubLeagueContent,
};