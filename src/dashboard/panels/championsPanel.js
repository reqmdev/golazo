const LeagueService = require('../../league/services/LeagueService');
const TournamentService = require('../../league/services/TournamentService');
const { buildDashboardShell, wrapVisualPanel } = require('../design/shell');
const { buildPanelChrome } = require('../design/context');
const { buildDashboardBackRow } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { DASHBOARD_VIEWS, CHAMPIONS_ACTIONS } = require('../constants');
const { encodeDashboardId } = require('../ids');
const { formatTournamentStatus } = require('../../league/utils/formatChampions');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const {
    buildChampionsStatusPayload,
    buildChampionsGroupStandingsPayload,
    buildChampionsBracketPayload,
    buildChampionsFixturePayload,
} = require('../../league/discord/championsNav');
const { buildChampionsScorePayload } = require('../../league/discord/championsScoreNav');

/**
 * @param {object} input
 */
async function buildChampionsPanelPayload(input) {
    const {
        guildId,
        slug,
        member,
        userId,
        tr,
        guild,
        client,
        locale,
        subView = CHAMPIONS_ACTIONS.STATUS,
        groupIndex = 0,
    } = input;

    const league = await LeagueService.resolveLeague(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });

    if (!league.championsLeague?.enabled) {
        return buildDashboardShell({
            ...buildPanelChrome({
                view: DASHBOARD_VIEWS.CHAMPIONS,
                tr,
                slug,
                guildName: guild?.name,
                league,
                footerRole: viewer.roleKey,
                hint: tr('handlers.champions.notEnabledHint'),
                hintTone: 'warning',
            }),
            bodyBuilder: () => tr('handlers.champions.notEnabledHint'),
            actionRows: [buildDashboardBackRow(tr, slug)],
        });
    }

    const { tournament } = await TournamentService.getTournamentState(guildId, slug);

    let leaguePayload;

    if (subView === CHAMPIONS_ACTIONS.GROUPS && tournament) {
        leaguePayload = await buildChampionsGroupStandingsPayload({
            guildId,
            slug,
            tr,
            client,
            groupIndex,
        });
    } else if (subView === CHAMPIONS_ACTIONS.BRACKET && tournament) {
        leaguePayload = await buildChampionsBracketPayload({
            guildId,
            slug,
            tr,
            client,
        });
    } else if (subView === CHAMPIONS_ACTIONS.FIXTURE && tournament) {
        leaguePayload = await buildChampionsFixturePayload({
            guildId,
            slug,
            tr,
        });
    } else if (subView === CHAMPIONS_ACTIONS.SCORE && tournament) {
        leaguePayload = await buildChampionsScorePayload({
            guildId,
            slug,
            tr,
            actorId: userId,
        });
    } else {
        leaguePayload = await buildChampionsStatusPayload({
            guildId,
            slug,
            tr,
            client,
        });
    }

    const manageRows = [];

    if (viewer.canManage && tournament && tournament.status !== 'completed' && tournament.status !== 'cancelled') {
        manageRows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.CHAMPIONS, CHAMPIONS_ACTIONS.CANCEL, slug))
                    .setLabel(tr('handlers.champions.cancel.button'))
                    .setStyle(ButtonStyle.Danger),
            ),
        );
    }

    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.CHAMPIONS, CHAMPIONS_ACTIONS.STATUS, slug))
            .setLabel(tr('handlers.champions.nav.status'))
            .setStyle(subView === CHAMPIONS_ACTIONS.STATUS ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(
                DASHBOARD_VIEWS.CHAMPIONS,
                CHAMPIONS_ACTIONS.GROUPS,
                `${slug}|${groupIndex}`,
            ))
            .setLabel(tr('handlers.champions.nav.groups'))
            .setStyle(subView === CHAMPIONS_ACTIONS.GROUPS ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.CHAMPIONS, CHAMPIONS_ACTIONS.BRACKET, slug))
            .setLabel(tr('handlers.champions.nav.bracket'))
            .setStyle(subView === CHAMPIONS_ACTIONS.BRACKET ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.CHAMPIONS, CHAMPIONS_ACTIONS.FIXTURE, slug))
            .setLabel(tr('handlers.champions.nav.fixture'))
            .setStyle(subView === CHAMPIONS_ACTIONS.FIXTURE ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.CHAMPIONS, CHAMPIONS_ACTIONS.SCORE, slug))
            .setLabel(tr('handlers.champions.nav.score'))
            .setStyle(subView === CHAMPIONS_ACTIONS.SCORE ? ButtonStyle.Primary : ButtonStyle.Secondary),
    );

    const statusLine = tournament
        ? formatTournamentStatus(tournament, tr)
        : tr('handlers.champions.awaitingSeasonEnd');

    return wrapVisualPanel({
        chrome: buildPanelChrome({
            view: DASHBOARD_VIEWS.CHAMPIONS,
            tr,
            slug,
            guildName: guild?.name,
            league,
            footerRole: viewer.roleKey,
            hint: statusLine,
        }),
        leaguePayload,
        backRow: buildDashboardBackRow(tr, slug),
        externalActionRows: [navRow, ...manageRows],
    });
}

module.exports = {
    buildChampionsPanelPayload,
};
