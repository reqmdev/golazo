const { calculateStandings } = require('../algorithms/standingCalculator');
const { DEFAULT_POINTS, DEFAULT_TIEBREAKERS, DEFAULT_FORFEIT_SCORE } = require('../constants/defaults');

/**
 * Calculate group standings from tournament group matches.
 *
 * @param {object[]} teams
 * @param {object[]} matches
 * @param {object} [pointsRules]
 * @param {string[]} [tiebreakers]
 */
function calculateGroupStandings(teams, matches, pointsRules, tiebreakers) {
    return calculateStandings(
        teams,
        matches,
        pointsRules || DEFAULT_POINTS,
        tiebreakers || DEFAULT_TIEBREAKERS,
        DEFAULT_FORFEIT_SCORE,
    );
}

/**
 * Resolve qualifiers from group standings.
 *
 * @param {{ groupId: string, entries: object[] }[]} groupStandings
 * @param {number} qualifiersPerGroup
 * @param {number} [targetCount]
 */
function resolveGroupQualifiers(groupStandings, qualifiersPerGroup, targetCount = null) {
    /** @type {string[]} */
    const qualified = [];

    for (const group of groupStandings) {
        const sorted = [...group.entries].sort((a, b) => a.rank - b.rank);
        const picks = sorted.slice(0, qualifiersPerGroup);

        for (const entry of picks) {
            qualified.push(entry.teamId.toString());
        }
    }

    if (targetCount && qualified.length > targetCount) {
        return qualified.slice(0, targetCount);
    }

    return qualified;
}

module.exports = {
    calculateGroupStandings,
    resolveGroupQualifiers,
};
