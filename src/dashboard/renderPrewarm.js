const FixtureService = require('../league/services/FixtureService');
const LeagueService = require('../league/services/LeagueService');
const StandingService = require('../league/services/StandingService');
const TeamService = require('../league/services/TeamService');
const { enrichTeamsWithLogoUrls } = require('../league/utils/resolveTeamLogoUrl');
const RenderService = require('../league/render/services/RenderService');
const { enrichTeamMap } = require('../league/utils/teamMap');
const { paginateTable } = require('../league/render/drawing/paginateTable');
const { LAYOUT } = require('../league/render/constants/layout');
const { CARD_PAGE_SIZES } = require('../league/constants/cardPageSize');

/**
 * Warm render cache in the background so panel opens feel instant.
 *
 * @param {object} input
 */
async function prewarmLeagueRenders(input) {
    const {
        guildId,
        slug,
        locale = 'en',
        tr,
        client,
        league,
    } = input;

    if (!client || !league?.fixtureGeneratedAt) {
        return;
    }

    const tasks = [
        prewarmFixtureRender({ guildId, slug, locale, tr, client }),
        prewarmStandingsRender({ guildId, slug, locale, tr, client }),
        prewarmTeamListRender({ guildId, slug, locale, tr, client }),
    ];

    await Promise.allSettled(tasks);
}

/**
 * @param {object} input
 */
async function prewarmFixtureRender(input) {
    const { guildId, slug, locale, tr, client } = input;
    const fixtureData = await FixtureService.getFixture(guildId, slug);

    if (!fixtureData.matches.length) {
        return;
    }

    const { league, round, matches, teamMap, byeTeams } = fixtureData;
    const enrichedTeamMap = await enrichTeamMap(teamMap, client);
    const pageInfo = paginateTable(matches, {
        page: 1,
        pageSize: LAYOUT.maxFixtureRowsPerPage,
    });

    await RenderService.renderFixture(league, round, matches, enrichedTeamMap, byeTeams, {
        page: pageInfo.page,
        locale,
        tr,
    });
}

/**
 * @param {object} input
 */
async function prewarmStandingsRender(input) {
    const { guildId, slug, locale, tr, client } = input;
    const { league, standing, teamMap } = await StandingService.getStandings(guildId, slug);

    if (!standing) {
        return;
    }

    const enrichedTeamMap = await enrichTeamMap(teamMap, client);

    await RenderService.renderStandings(league, standing, enrichedTeamMap, {
        page: 1,
        locale,
        tr,
    });
}

/**
 * @param {object} input
 */
async function prewarmTeamListRender(input) {
    const { guildId, slug, locale, tr, client } = input;
    const league = await LeagueService.resolveLeague(guildId, slug);
    const teams = await TeamService.listTeams(guildId, slug);

    if (!teams.length) {
        return;
    }

    const enrichedTeams = await enrichTeamsWithLogoUrls(client, teams);

    await RenderService.renderTeamList(league, enrichedTeams, {
        page: 1,
        locale,
        tr,
    });
}

/**
 * @param {object} input
 */
function scheduleLeagueRenderPrewarm(input) {
    void prewarmLeagueRenders(input).catch(() => {});
}

module.exports = {
    prewarmLeagueRenders,
    scheduleLeagueRenderPrewarm,
};