const { hexToDiscordColor, BRAND, PAGE_ACCENTS } = require('../../canvas/tokens');
const { DASHBOARD_VIEWS } = require('../constants');

/** Dashboard accent colors per view (decimal for Discord Container). */
const DASHBOARD_VIEW_ACCENTS = {
    [DASHBOARD_VIEWS.HUB]: hexToDiscordColor(BRAND.green),
    [DASHBOARD_VIEWS.LEAGUE]: hexToDiscordColor(PAGE_ACCENTS.overview),
    [DASHBOARD_VIEWS.TEAMS]: hexToDiscordColor(PAGE_ACCENTS.teams),
    [DASHBOARD_VIEWS.FIXTURE]: hexToDiscordColor(PAGE_ACCENTS.league_step_2),
    [DASHBOARD_VIEWS.SCORE]: hexToDiscordColor(PAGE_ACCENTS.matches),
    [DASHBOARD_VIEWS.STANDINGS]: hexToDiscordColor(PAGE_ACCENTS.league_step_6),
    [DASHBOARD_VIEWS.SETTINGS]: hexToDiscordColor(BRAND.utility),
    [DASHBOARD_VIEWS.MATCH_OPS]: hexToDiscordColor(PAGE_ACCENTS.league_step_5),
    [DASHBOARD_VIEWS.ADMIN]: hexToDiscordColor(PAGE_ACCENTS.admin),
};

/** ui.emoji.* keys per dashboard view. */
const DASHBOARD_VIEW_EMOJI_KEYS = {
    [DASHBOARD_VIEWS.HUB]: 'brand',
    [DASHBOARD_VIEWS.LEAGUE]: 'league',
    [DASHBOARD_VIEWS.TEAMS]: 'team',
    [DASHBOARD_VIEWS.FIXTURE]: 'fixture',
    [DASHBOARD_VIEWS.SCORE]: 'score',
    [DASHBOARD_VIEWS.STANDINGS]: 'standings',
    [DASHBOARD_VIEWS.SETTINGS]: 'settings',
    [DASHBOARD_VIEWS.MATCH_OPS]: 'matchOps',
    [DASHBOARD_VIEWS.ADMIN]: 'warning',
};

/** dashboard.panels.* i18n keys per view (hub/league use dedicated keys). */
const DASHBOARD_VIEW_TITLE_KEYS = {
    [DASHBOARD_VIEWS.HUB]: 'dashboard.hub.title',
    [DASHBOARD_VIEWS.TEAMS]: 'dashboard.panels.teams.title',
    [DASHBOARD_VIEWS.FIXTURE]: 'dashboard.panels.fixture.title',
    [DASHBOARD_VIEWS.SCORE]: 'dashboard.panels.score.title',
    [DASHBOARD_VIEWS.STANDINGS]: 'dashboard.panels.standings.title',
    [DASHBOARD_VIEWS.SETTINGS]: 'dashboard.panels.settings.title',
    [DASHBOARD_VIEWS.MATCH_OPS]: 'dashboard.panels.matchOps.title',
    [DASHBOARD_VIEWS.ADMIN]: 'dashboard.panels.admin.title',
};

/**
 * @param {string} view
 */
function resolveDashboardAccent(view) {
    return DASHBOARD_VIEW_ACCENTS[view] ?? DASHBOARD_VIEW_ACCENTS[DASHBOARD_VIEWS.HUB];
}

module.exports = {
    DASHBOARD_VIEW_ACCENTS,
    DASHBOARD_VIEW_EMOJI_KEYS,
    DASHBOARD_VIEW_TITLE_KEYS,
    resolveDashboardAccent,
};