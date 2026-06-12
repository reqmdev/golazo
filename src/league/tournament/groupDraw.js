const { seededGroupDraw } = require('./formatResolver');

/**
 * Perform seeded group draw for Champions League.
 *
 * @param {object[]} qualifiedTeams
 * @param {number} groupCount
 */
function performGroupDraw(qualifiedTeams, groupCount) {
    if (groupCount <= 0) {
        return [];
    }

    return seededGroupDraw(qualifiedTeams, groupCount);
}

module.exports = {
    performGroupDraw,
};
