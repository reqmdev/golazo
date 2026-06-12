const { calculateStandings } = require('../algorithms/standingCalculator');
const { DEFAULT_POINTS, DEFAULT_TIEBREAKERS, DEFAULT_FORFEIT_SCORE } = require('../constants/defaults');

/**
 * @param {object} a
 * @param {object} b
 */
function compareQualifierEntry(a, b) {
    if (b.points !== a.points) {
        return b.points - a.points;
    }

    if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
    }

    if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
    }

    return a.rank - b.rank;
}

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
 * @param {boolean} [useBestThirds]
 */
function resolveGroupQualifiers(groupStandings, qualifiersPerGroup, targetCount = null, useBestThirds = false) {
    /** @type {string[]} */
    const qualified = [];
    /** @type {object[]} */
    const thirdPlaceCandidates = [];

    for (const group of groupStandings) {
        const sorted = [...group.entries].sort((a, b) => a.rank - b.rank);
        const picks = sorted.slice(0, qualifiersPerGroup);

        for (const entry of picks) {
            qualified.push(entry.teamId.toString());
        }

        if (useBestThirds && sorted.length >= 3) {
            thirdPlaceCandidates.push({ ...sorted[2], groupId: group.groupId });
        }
    }

    if (useBestThirds && targetCount && qualified.length < targetCount) {
        const rankedThirds = [...thirdPlaceCandidates].sort(compareQualifierEntry);

        for (const entry of rankedThirds) {
            if (qualified.length >= targetCount) {
                break;
            }

            const teamId = entry.teamId.toString();

            if (!qualified.includes(teamId)) {
                qualified.push(teamId);
            }
        }
    }

    if (targetCount && qualified.length > targetCount) {
        /** @type {Map<string, object>} */
        const entryByTeam = new Map();

        for (const group of groupStandings) {
            for (const entry of group.entries) {
                entryByTeam.set(entry.teamId.toString(), entry);
            }
        }

        const ranked = qualified
            .map((teamId) => entryByTeam.get(teamId))
            .filter(Boolean)
            .sort(compareQualifierEntry);

        return ranked.slice(0, targetCount).map((entry) => entry.teamId.toString());
    }

    return qualified;
}

module.exports = {
    calculateGroupStandings,
    resolveGroupQualifiers,
    compareQualifierEntry,
};
