/**
 * @deprecated Use src/league/fixture/fixtureEngine.js — kept for backward-compatible imports.
 */
const {
    buildLeagueSchedule,
    getTotalRounds,
    getExpectedMatchCount
} = require('../fixture/fixtureEngine');

/**
 * @param {string[] | import('mongoose').Types.ObjectId[]} teamIds
 * @param {{ legs?: 1 | 2 }} options
 */
function generateRoundRobin(teamIds, options = {}) {
    return buildLeagueSchedule(teamIds, options);
}

module.exports = {
    generateRoundRobin,
    getTotalRounds,
    getExpectedMatchCount
};