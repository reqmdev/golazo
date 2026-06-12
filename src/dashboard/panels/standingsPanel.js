const LeagueError = require('../../league/errors/LeagueError');
const LeagueService = require('../../league/services/LeagueService');
const TeamRepository = require('../../league/repositories/TeamRepository');
const { buildStandingsShowPayload } = require('../../league/discord/standingsNav');
const { stripLeagueReplyMeta } = require('../../league/utils/visualV2Reply');
const { buildDashboardShell, wrapVisualPanel } = require('../design/shell');
const { buildPanelChrome } = require('../design/context');
const { buildDashboardBackRow, encodePanelRef } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { DASHBOARD_VIEWS, STANDINGS_ACTIONS } = require('../constants');
const { encodeDashboardId } = require('../ids');

/**
 * @param {string} slug
 * @param {number} page
 * @param {string} action
 */
function encodeDashboardStandingsNavId(slug, page, action) {
    return encodeDashboardId(
        DASHBOARD_VIEWS.STANDINGS,
        action,
        encodePanelRef(slug, String(page)),
    );
}

/**
 * @param {object} input
 */
async function buildStandingsPanelPayload(input) {
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
    const teamCount = await TeamRepository.countActiveByLeague(league._id);

    try {
        const payload = await buildStandingsShowPayload({
            guildId,
            slug,
            locale,
            tr,
            client,
            page,
            encodeNavId: encodeDashboardStandingsNavId,
        });

        return wrapVisualPanel({
            chrome: buildPanelChrome({
                view: DASHBOARD_VIEWS.STANDINGS,
                tr,
                slug,
                guildName: guild?.name,
                league,
                teamCount,
                footerRole: viewer.roleKey,
            }),
            leaguePayload: stripLeagueReplyMeta(payload),
            backRow: buildDashboardBackRow(tr, slug),
        });
    } catch (err) {
        if (err instanceof LeagueError && err.code === 'NO_FIXTURE_VIEW') {
            return buildDashboardShell({
                ...buildPanelChrome({
                    view: DASHBOARD_VIEWS.STANDINGS,
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

        throw err;
    }
}

module.exports = {
    buildStandingsPanelPayload,
    encodeDashboardStandingsNavId,
};