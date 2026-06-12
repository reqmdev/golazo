const DASHBOARD_PREFIX = 'ldb:';

const DASHBOARD_VIEWS = {
    HUB: 'hub',
    LEAGUE: 'lg',
    TEAMS: 'tm',
    FIXTURE: 'fx',
    SCORE: 'sc',
    STANDINGS: 'st',
    SETTINGS: 'set',
    MATCH_OPS: 'mt',
    ADMIN: 'adm',
    CHAMPIONS: 'cl',
};

const HUB_ACTIONS = {
    LEAGUE_SELECT: 'league',
    CREATE: 'create',
};

const LEAGUE_ACTIONS = {
    PANEL: 'panel',
    BACK: 'back',
};

const TEAM_ACTIONS = {
    ADD: 'add',
    REMOVE: 'rm',
    GENERATE: 'gen',
};

const SETTINGS_ACTIONS = {
    POINTS: 'pts',
    PERM_USER: 'pu',
    PERM_APPLY: 'pa',
    CHANNEL: 'ch',
    CL_ENABLE: 'clen',
    CL_DISABLE: 'cldis',
};

const MATCH_OPS_ACTIONS = {
    SELECT: 'sel',
    POSTPONE: 'post',
    CANCEL: 'can',
    RESUME: 'res',
    FORFEIT: 'ff',
};

const ADMIN_ACTIONS = {
    REFRESH: 'ref',
    ROLLBACK: 'rb',
    RESET: 'rst',
    RESET_CONFIRM: 'rstc',
};

const STANDINGS_ACTIONS = {
    PREV_PAGE: 'pp',
    NEXT_PAGE: 'np',
    PAGE_LABEL: 'pg',
};

const CHAMPIONS_ACTIONS = {
    STATUS: 'st',
    GROUPS: 'gs',
    BRACKET: 'br',
    ENABLE: 'en',
    DISABLE: 'dis',
};

const CL_SETTINGS_ACTIONS = {
    TOGGLE: 'tg',
    SPOTS: 'sp',
};

const PANEL_OPTIONS = [
    DASHBOARD_VIEWS.LEAGUE,
    DASHBOARD_VIEWS.TEAMS,
    DASHBOARD_VIEWS.FIXTURE,
    DASHBOARD_VIEWS.SCORE,
    DASHBOARD_VIEWS.STANDINGS,
    DASHBOARD_VIEWS.CHAMPIONS,
    DASHBOARD_VIEWS.SETTINGS,
    DASHBOARD_VIEWS.MATCH_OPS,
    DASHBOARD_VIEWS.ADMIN,
];

const MODAL_IDS = {
    CREATE_LEAGUE: `${DASHBOARD_PREFIX}modal:create`,
    ADD_TEAM: `${DASHBOARD_PREFIX}modal:team:add`,
    REMOVE_TEAM: `${DASHBOARD_PREFIX}modal:team:rm`,
    EDIT_POINTS: `${DASHBOARD_PREFIX}modal:set:pts`,
    FORFEIT: `${DASHBOARD_PREFIX}modal:mt:ff`,
};

module.exports = {
    DASHBOARD_PREFIX,
    DASHBOARD_VIEWS,
    HUB_ACTIONS,
    LEAGUE_ACTIONS,
    TEAM_ACTIONS,
    SETTINGS_ACTIONS,
    MATCH_OPS_ACTIONS,
    ADMIN_ACTIONS,
    STANDINGS_ACTIONS,
    CHAMPIONS_ACTIONS,
    CL_SETTINGS_ACTIONS,
    PANEL_OPTIONS,
    MODAL_IDS,
};