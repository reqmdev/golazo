const { MATCH_STATUS } = require('../constants/matchStatus');
const { STANDINGS_ELIGIBLE_STATUSES } = require('./constants');
const { DEFAULT_FORFEIT_SCORE } = require('../constants/defaults');

/**
 * @param {object} match
 */
function isStandingsEligible(match) {
    return STANDINGS_ELIGIBLE_STATUSES.includes(match.status);
}

/**
 * Normalized match sort key for deterministic processing order.
 * @param {object} match
 */
function matchSortKey(match) {
    const id = match._id?.toString() || '';
    return `${String(match.round).padStart(4, '0')}:${String(match.leg).padStart(2, '0')}:${id}`;
}

/**
 * Deduplicate matches by _id (safety against bad data).
 * @param {object[]} matches
 */
function matchSlotKey(match) {
    return `${match.leg}:${match.round}:${match.homeTeamId}:${match.awayTeamId}`;
}

function dedupeMatches(matches) {
    const seenIds = new Set();
    const seenSlots = new Set();
    const unique = [];

    for (const match of matches) {
        const id = match._id?.toString();
        const slot = matchSlotKey(match);

        if (!id || seenIds.has(id) || seenSlots.has(slot)) {
            continue;
        }

        seenIds.add(id);
        seenSlots.add(slot);
        unique.push(match);
    }

    return unique;
}

/**
 * @param {object[]} matches
 */
function sortMatchesForProcessing(matches) {
    return [...matches].sort((a, b) => matchSortKey(a).localeCompare(matchSortKey(b)));
}

/**
 * Resolve display/competition goals from a match record.
 * Returns null when the match cannot contribute to standings.
 *
 * @param {object} match
 * @param {{ winnerGoals?: number, loserGoals?: number }} forfeitScore
 * @returns {{ home: number, away: number } | null}
 */
function resolveMatchGoals(match, forfeitScore = DEFAULT_FORFEIT_SCORE) {
    if (!isStandingsEligible(match)) {
        return null;
    }

    if (match.status === MATCH_STATUS.WALKOVER) {
        const winnerId = match.meta?.walkoverWinnerId?.toString();
        const homeId = match.homeTeamId.toString();
        const awayId = match.awayTeamId.toString();

        if (!winnerId || (winnerId !== homeId && winnerId !== awayId)) {
            return null;
        }

        if (winnerId === homeId) {
            return { home: forfeitScore.winnerGoals, away: forfeitScore.loserGoals };
        }

        return { home: forfeitScore.loserGoals, away: forfeitScore.winnerGoals };
    }

    if (match.status === MATCH_STATUS.COMPLETED) {
        const home = match.score?.home;
        const away = match.score?.away;

        if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
            return null;
        }

        return { home, away };
    }

    return null;
}

/**
 * Pure outcome from goal counts.
 * @param {number} homeGoals
 * @param {number} awayGoals
 * @param {{ pointsWin: number, pointsDraw: number, pointsLoss: number }} pointsRules
 */
function deriveOutcome(homeGoals, awayGoals, pointsRules) {
    if (homeGoals > awayGoals) {
        return {
            home: { result: 'W', points: pointsRules.pointsWin },
            away: { result: 'L', points: pointsRules.pointsLoss }
        };
    }

    if (homeGoals < awayGoals) {
        return {
            home: { result: 'L', points: pointsRules.pointsLoss },
            away: { result: 'W', points: pointsRules.pointsWin }
        };
    }

    return {
        home: { result: 'D', points: pointsRules.pointsDraw },
        away: { result: 'D', points: pointsRules.pointsDraw }
    };
}

module.exports = {
    isStandingsEligible,
    matchSortKey,
    matchSlotKey,
    dedupeMatches,
    sortMatchesForProcessing,
    resolveMatchGoals,
    deriveOutcome
};