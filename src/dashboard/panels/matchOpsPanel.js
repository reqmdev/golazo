const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require('discord.js');
const LeagueService = require('../../league/services/LeagueService');
const FixtureService = require('../../league/services/FixtureService');
const MatchRepository = require('../../league/repositories/MatchRepository');
const TeamRepository = require('../../league/repositories/TeamRepository');
const { MATCH_STATUS } = require('../../league/constants/matchStatus');
const { buildDashboardShell } = require('../design/shell');
const { buildPanelChrome } = require('../design/context');
const { buildDashboardBackRow } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { encodeDashboardId } = require('../ids');
const { DASHBOARD_VIEWS, MATCH_OPS_ACTIONS } = require('../constants');

/**
 * @param {object} match
 * @param {Map<string, object>} teamMap
 * @param {(key: string, params?: object) => string} tr
 */
function formatMatchOption(match, teamMap, tr) {
    const home = teamMap.get(match.homeTeamId.toString());
    const away = teamMap.get(match.awayTeamId.toString());
    const homeName = home?.shortName || home?.name || '?';
    const awayName = away?.shortName || away?.name || '?';

    return tr('dashboard.matchOps.option', {
        home: homeName,
        away: awayName,
        round: match.round,
        status: match.status,
    }).slice(0, 100);
}

/**
 * @param {object} input
 */
async function buildMatchOpsPanelPayload(input) {
    const { guildId, slug, member, userId, tr, guild, selectedMatchId } = input;
    const league = await LeagueService.resolveLeague(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });

    const teamCount = await TeamRepository.countActiveByLeague(league._id);

    if (!league.fixtureGeneratedAt) {
        return buildDashboardShell({
            ...buildPanelChrome({
                view: DASHBOARD_VIEWS.MATCH_OPS,
                tr,
                slug,
                guildName: guild?.name,
                league,
                teamCount,
                footerRole: viewer.roleKey,
                hint: tr('handlers.standings.noFixture'),
                hintTone: 'warning',
            }),
            externalActionRows: [buildDashboardBackRow(tr, slug)],
        });
    }

    const { matches } = await FixtureService.getFixture(guildId, slug);
    const teams = await TeamRepository.listActiveByLeague(league._id);
    const teamMap = new Map(teams.map((team) => [team._id.toString(), team]));

    const manageable = matches.filter((match) =>
        [MATCH_STATUS.SCHEDULED, MATCH_STATUS.LIVE, MATCH_STATUS.POSTPONED].includes(match.status),
    );

    let hint = tr('dashboard.matchOps.hint');
    let hintTone = 'info';

    const actionRows = [];

    if (viewer.canManage && manageable.length > 0) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.MATCH_OPS, MATCH_OPS_ACTIONS.SELECT, slug))
            .setPlaceholder(tr('dashboard.matchOps.selectMatch'))
            .addOptions(
                manageable.slice(0, 25).map((match) => ({
                    label: formatMatchOption(match, teamMap, tr),
                    value: match._id.toString(),
                    default: selectedMatchId === match._id.toString(),
                })),
            );

        actionRows.push(new ActionRowBuilder().addComponents(menu));

        if (selectedMatchId) {
            const selected = manageable.find((match) => match._id.toString() === selectedMatchId);

            if (selected) {
                const home = teamMap.get(selected.homeTeamId.toString());
                const away = teamMap.get(selected.awayTeamId.toString());
                hint = tr('dashboard.design.callout.matchSelected', {
                    home: home?.shortName || home?.name || '?',
                    away: away?.shortName || away?.name || '?',
                    status: selected.status,
                });

                const canPostpone = [MATCH_STATUS.SCHEDULED, MATCH_STATUS.LIVE].includes(selected.status);
                const canCancel = [MATCH_STATUS.SCHEDULED, MATCH_STATUS.LIVE, MATCH_STATUS.POSTPONED].includes(selected.status);
                const canResume = selected.status === MATCH_STATUS.POSTPONED;

                actionRows.push(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.MATCH_OPS, MATCH_OPS_ACTIONS.POSTPONE, selectedMatchId))
                            .setLabel(tr('dashboard.matchOps.postpone'))
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(!canPostpone),
                        new ButtonBuilder()
                            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.MATCH_OPS, MATCH_OPS_ACTIONS.CANCEL, selectedMatchId))
                            .setLabel(tr('dashboard.matchOps.cancel'))
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(!canCancel),
                        new ButtonBuilder()
                            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.MATCH_OPS, MATCH_OPS_ACTIONS.RESUME, selectedMatchId))
                            .setLabel(tr('dashboard.matchOps.resume'))
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(!canResume),
                        new ButtonBuilder()
                            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.MATCH_OPS, MATCH_OPS_ACTIONS.FORFEIT, selectedMatchId))
                            .setLabel(tr('dashboard.matchOps.forfeit'))
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(![MATCH_STATUS.SCHEDULED, MATCH_STATUS.LIVE].includes(selected.status)),
                    ),
                );
            }
        }
    } else if (!viewer.canManage) {
        hint = tr('dashboard.errors.adminOnly');
        hintTone = 'warning';
    } else {
        hint = tr('dashboard.matchOps.noMatches');
        hintTone = 'warning';
    }

    return buildDashboardShell({
        ...buildPanelChrome({
            view: DASHBOARD_VIEWS.MATCH_OPS,
            tr,
            slug,
            guildName: guild?.name,
            league,
            teamCount,
            footerRole: viewer.roleKey,
            hint,
            hintTone,
        }),
        actionRows,
        externalActionRows: [buildDashboardBackRow(tr, slug)],
    });
}

/**
 * @param {string} matchId
 */
async function resolveMatchContext(matchId) {
    const match = await MatchRepository.findById(matchId);

    if (!match) {
        return null;
    }

    const LeagueRepository = require('../../league/repositories/LeagueRepository');
    const league = await LeagueRepository.findById(match.leagueId);
    const [homeTeam, awayTeam] = await Promise.all([
        TeamRepository.findById(match.homeTeamId),
        TeamRepository.findById(match.awayTeamId),
    ]);

    return { match, league, homeTeam, awayTeam };
}

module.exports = {
    buildMatchOpsPanelPayload,
    resolveMatchContext,
};