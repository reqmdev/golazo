const RenderService = require('../render/services/RenderService');
const { buildTeamMap } = require('./teamMap');
const { tryRender } = require('./renderReply');

/**
 * @param {object} league
 * @param {object} match
 * @param {{ label?: string, locale?: string, tr?: Function }} [options]
 */
async function renderMatchVisual(league, match, options = {}) {
    const teamMap = await buildTeamMap(league._id, options.client ?? null);
    return tryRender(() =>
        RenderService.renderMatchResult(league, match, teamMap, {
            useCache: false,
            label: options.label,
            locale: options.locale,
            tr: options.tr
        })
    );
}

/**
 * @param {object} league
 * @param {object | null} standing
 * @param {Map<string, object>} teamMap
 * @param {{ page?: number, locale?: string, tr?: Function }} [options]
 */
async function renderStandingsVisual(league, standing, teamMap, options = {}) {
    if (!standing?.entries?.length) {
        return null;
    }

    return tryRender(() =>
        RenderService.renderStandings(league, standing, teamMap, {
            page: options.page ?? 1,
            locale: options.locale,
            tr: options.tr
        })
    );
}

/**
 * @param {object} league
 * @param {object[]} teams
 * @param {{ page?: number, locale?: string, tr?: Function, captainLabels?: Map<string, string>, roleLabels?: Map<string, string> }} [options]
 */
async function renderTeamsVisual(league, teams, options = {}) {
    if (!teams.length) return null;

    const { enrichTeamsWithLogoUrls } = require('./resolveTeamLogoUrl');
    const enrichedTeams = await enrichTeamsWithLogoUrls(options.client ?? null, teams);

    return tryRender(() =>
        RenderService.renderTeamList(league, enrichedTeams, {
            page: options.page ?? 1,
            locale: options.locale,
            tr: options.tr,
            captainLabels: options.captainLabels,
            roleLabels: options.roleLabels
        })
    );
}

module.exports = {
    renderMatchVisual,
    renderStandingsVisual,
    renderTeamsVisual
};