const LeagueService = require('../../league/services/LeagueService');
const TeamRepository = require('../../league/repositories/TeamRepository');
const { buildScoreEntryPayload } = require('../../league/discord/scoreNav');
const { stripLeagueReplyMeta } = require('../../league/utils/visualV2Reply');
const { wrapVisualPanel } = require('../design/shell');
const { buildPanelChrome } = require('../design/context');
const { buildDashboardBackRow } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { DASHBOARD_VIEWS } = require('../constants');

/**
 * @param {object} input
 */
async function buildScorePanelPayload(input) {
    const { guildId, slug, locale, tr, client, guild, member, userId } = input;
    const league = await LeagueService.resolveLeague(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });
    const teamCount = await TeamRepository.countActiveByLeague(league._id);

    const payload = await buildScoreEntryPayload({
        guildId,
        slug,
        locale,
        tr,
        client,
        actorId: userId,
        useVisual: true,
    });

    const hint = viewer.canReportScore
        ? tr('dashboard.design.callout.scoreCanReport')
        : tr('dashboard.design.callout.scoreViewOnly');

    return wrapVisualPanel({
        chrome: buildPanelChrome({
            view: DASHBOARD_VIEWS.SCORE,
            tr,
            slug,
            guildName: guild?.name,
            league,
            teamCount,
            footerRole: viewer.roleKey,
            hint,
            hintTone: viewer.canReportScore ? 'info' : 'warning',
        }),
        leaguePayload: stripLeagueReplyMeta(payload),
        backRow: buildDashboardBackRow(tr, slug),
    });
}

module.exports = {
    buildScorePanelPayload,
};