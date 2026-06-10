const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const LeagueService = require('../../league/services/LeagueService');
const TeamRepository = require('../../league/repositories/TeamRepository');
const { LEAGUE_STATUS } = require('../../league/constants/leagueStatus');
const { buildDashboardShell } = require('../design/shell');
const { buildViewerContext } = require('../permissions');
const { encodeDashboardId } = require('../ids');
const { DASHBOARD_VIEWS, LEAGUE_ACTIONS } = require('../constants');
const { buildLeagueInfoBlock } = require('../design/context');
const { buildTable } = require('../design/table');
const { scheduleLeagueRenderPrewarm } = require('../renderPrewarm');

const PANEL_OPTIONS = [
    { value: DASHBOARD_VIEWS.TEAMS, labelKey: 'dashboard.panels.teams.title', descKey: 'dashboard.panels.teams.desc', emoji: '👥' },
    { value: DASHBOARD_VIEWS.FIXTURE, labelKey: 'dashboard.panels.fixture.title', descKey: 'dashboard.panels.fixture.desc', emoji: '📅' },
    { value: DASHBOARD_VIEWS.SCORE, labelKey: 'dashboard.panels.score.title', descKey: 'dashboard.panels.score.desc', emoji: '⚽' },
    { value: DASHBOARD_VIEWS.STANDINGS, labelKey: 'dashboard.panels.standings.title', descKey: 'dashboard.panels.standings.desc', emoji: '📊' },
    { value: DASHBOARD_VIEWS.SETTINGS, labelKey: 'dashboard.panels.settings.title', descKey: 'dashboard.panels.settings.desc', emoji: '⚙️' },
    { value: DASHBOARD_VIEWS.MATCH_OPS, labelKey: 'dashboard.panels.matchOps.title', descKey: 'dashboard.panels.matchOps.desc', emoji: '🛠️' },
    { value: DASHBOARD_VIEWS.ADMIN, labelKey: 'dashboard.panels.admin.title', descKey: 'dashboard.panels.admin.desc', emoji: '📋' },
];

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {import('../design/layout').EmojiBudget} budget
 */
function buildPanelTable(tr, budget) {
    const emoji = budget.takeCandidate(['🧭', { key: 'page' }]);
    const titleLine = emoji
        ? `${emoji} ${tr('dashboard.design.sections.panels')}`
        : tr('dashboard.design.sections.panels');

    return buildTable(
        [
            { header: tr('dashboard.design.table.panel'), maxWidth: 22 },
            { header: tr('dashboard.design.table.description'), maxWidth: 40 },
        ],
        PANEL_OPTIONS.map((option) => [
            `${option.emoji} ${tr(option.labelKey)}`,
            tr(option.descKey),
        ]),
        { titleLine },
    );
}

/**
 * @param {object} input
 */
async function buildLeagueHubPayload(input) {
    const {
        guildId,
        slug,
        member,
        userId,
        tr,
        guildName,
        client,
        locale,
    } = input;
    const league = await LeagueService.resolveLeague(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });
    const teamCount = await TeamRepository.countActiveByLeague(league._id);

    let hint;

    if (league.status === LEAGUE_STATUS.REGISTRATION && !league.fixtureGeneratedAt) {
        hint = tr('dashboard.league.hintRegistration');
    } else if (league.status === LEAGUE_STATUS.ACTIVE) {
        hint = tr('dashboard.league.hintActive');
    }

    const panelSelect = new StringSelectMenuBuilder()
        .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.LEAGUE, LEAGUE_ACTIONS.PANEL, slug))
        .setPlaceholder(tr('dashboard.league.selectPanel'))
        .addOptions(
            PANEL_OPTIONS.map((option) => ({
                label: tr(option.labelKey).slice(0, 100),
                description: tr(option.descKey).slice(0, 100),
                value: option.value,
                emoji: option.emoji,
            })),
        );

    scheduleLeagueRenderPrewarm({
        guildId,
        slug,
        locale,
        tr,
        client,
        league,
    });

    return buildDashboardShell({
        view: DASHBOARD_VIEWS.LEAGUE,
        tr,
        title: league.name,
        guildName: guildName || '',
        slug,
        chromeBuilder: (budget) => buildLeagueInfoBlock(tr, league, teamCount, budget),
        bodyBuilder: (budget) => buildPanelTable(tr, budget),
        hint,
        footerRole: viewer.roleKey,
        actionRows: [
            new ActionRowBuilder().addComponents(panelSelect),
        ],
        externalActionRows: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.LEAGUE, LEAGUE_ACTIONS.BACK))
                    .setLabel(tr('dashboard.league.back'))
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏠'),
            ),
        ],
        skipContentSeparator: true,
    });
}

module.exports = {
    buildLeagueHubPayload,
    buildPanelTable,
    PANEL_OPTIONS,
};