const { DEFAULT_TEAM_LIMITS } = require('./defaults');

/**
 * Max rows per visual card page — aligned with league team cap so one PNG fits all teams.
 * Fixture: at most half the teams play per round (round-robin).
 */
const CARD_PAGE_SIZES = {
    standings: DEFAULT_TEAM_LIMITS.maxTeams,
    teamList: DEFAULT_TEAM_LIMITS.maxTeams,
    fixture: Math.floor(DEFAULT_TEAM_LIMITS.maxTeams / 2),
};

module.exports = { CARD_PAGE_SIZES };