const LeagueError = require('../../league/errors/LeagueError');
const LeagueService = require('../../league/services/LeagueService');
const { buildStandingsShowPayload } = require('../../league/discord/standingsNav');
const { stripLeagueReplyMeta } = require('../../league/utils/visualV2Reply');
const { buildDashboardShell, wrapVisualPanel } = require('../design/shell');
const { buildPanelChrome } = require('../design/context');
const { buildDashboardBackRow } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { DASHBOARD_VIEWS } = require('../constants');

/**
 * @param {object} input
 */
async function buildStandingsPanelPayload(input) {
    const { guildId, slug, locale, tr, client, guild, member, userId } = input;
    const league = await LeagueService.resolveLeague(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });

    try {
        const payload = await buildStandingsShowPayload({
            guildId,
            slug,
            locale,
            tr,
            client,
        });

        return wrapVisualPanel({
            chrome: buildPanelChrome({
                view: DASHBOARD_VIEWS.STANDINGS,
                tr,
                slug,
                guildName: guild?.name,
                league,
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
};