const LeagueService = require('../../league/services/LeagueService');
const { buildFixtureShowPayload } = require('../../league/discord/fixtureNav');
const { stripLeagueReplyMeta } = require('../../league/utils/visualV2Reply');
const { wrapVisualPanel } = require('../design/shell');
const TeamRepository = require('../../league/repositories/TeamRepository');
const { buildPanelChrome } = require('../design/context');
const { buildDashboardBackRow } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { DASHBOARD_VIEWS } = require('../constants');
/**
 * @param {object} input
 */
async function buildFixturePanelPayload(input) {
    const { guildId, slug, locale, tr, client, guild, member, userId } = input;
    const league = await LeagueService.resolveLeague(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });
    const teamCount = await TeamRepository.countActiveByLeague(league._id);

    const payload = await buildFixtureShowPayload({
        guildId,
        slug,
        locale,
        tr,
        client,
        useVisual: true,
    });

    return wrapVisualPanel({
        chrome: buildPanelChrome({
            view: DASHBOARD_VIEWS.FIXTURE,
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
}

module.exports = {
    buildFixturePanelPayload,
};