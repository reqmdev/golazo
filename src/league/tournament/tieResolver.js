const { MATCH_STATUS } = require('../constants/matchStatus');
const { resolveMatchGoals } = require('../match/matchResult');
const { DEFAULT_FORFEIT_SCORE } = require('../constants/defaults');

const ELIGIBLE = [MATCH_STATUS.COMPLETED, MATCH_STATUS.WALKOVER];

/**
 * @param {object} match
 */
function isEligibleMatch(match) {
    return ELIGIBLE.includes(match.status);
}

/**
 * Resolve aggregate goals for a two-legged tie.
 *
 * @param {object[]} matches both legs of the tie
 * @param {string} teamAId
 * @param {string} teamBId
 */
function resolveAggregate(matches, teamAId, teamBId) {
    const teamA = teamAId.toString();
    const teamB = teamBId.toString();
    let goalsA = 0;
    let goalsB = 0;

    for (const match of matches) {
        if (!isEligibleMatch(match)) {
            continue;
        }

        const goals = resolveMatchGoals(match, DEFAULT_FORFEIT_SCORE);

        if (!goals) {
            continue;
        }

        const homeId = match.homeTeamId.toString();
        const awayId = match.awayTeamId.toString();

        if (homeId === teamA) {
            goalsA += goals.home;
            goalsB += goals.away;
        } else if (homeId === teamB) {
            goalsB += goals.home;
            goalsA += goals.away;
        }
    }

    return { goalsA, goalsB };
}

/**
 * Resolve tie winner from completed matches.
 *
 * @param {object} tie
 * @param {object[]} matches
 */
function resolveTieWinner(tie, matches) {
    if (tie.isBye && tie.teamAId) {
        return tie.teamAId.toString();
    }

    if (!tie.teamAId || !tie.teamBId) {
        return null;
    }

    const teamA = tie.teamAId.toString();
    const teamB = tie.teamBId.toString();
    const tieMatches = matches.filter((m) => m.tieId === tie.tieId);

    if (tieMatches.length === 0) {
        return null;
    }

    const allResolved = tieMatches.every(isEligibleMatch);

    if (!allResolved) {
        return null;
    }

    const { goalsA, goalsB } = resolveAggregate(tieMatches, teamA, teamB);

    if (goalsA > goalsB) {
        return teamA;
    }

    if (goalsB > goalsA) {
        return teamB;
    }

    const penMatch = tieMatches.find(
        (m) => m.tieBreak?.penaltiesHome != null && m.tieBreak?.penaltiesAway != null,
    );

    if (penMatch) {
        const homeId = penMatch.homeTeamId.toString();
        const penHome = penMatch.tieBreak.penaltiesHome;
        const penAway = penMatch.tieBreak.penaltiesAway;

        if (homeId === teamA) {
            if (penHome > penAway) return teamA;
            if (penAway > penHome) return teamB;
        } else {
            if (penHome > penAway) return teamB;
            if (penAway > penHome) return teamA;
        }
    }

    return null;
}

/**
 * Check if all matches in a tie are resolved.
 *
 * @param {object} tie
 * @param {object[]} matches
 */
function isTieResolved(tie, matches) {
    if (tie.isBye) {
        return true;
    }

    const tieMatches = matches.filter((m) => m.tieId === tie.tieId);

    if (tieMatches.length === 0) {
        return false;
    }

    return tieMatches.every(isEligibleMatch) && resolveTieWinner(tie, tieMatches) !== null;
}

/**
 * Check if aggregate is tied after all legs (needs penalties).
 *
 * @param {object} tie
 * @param {object[]} matches
 */
function needsPenalties(tie, matches) {
    if (tie.isBye || !tie.teamAId || !tie.teamBId) {
        return false;
    }

    const tieMatches = matches.filter((m) => m.tieId === tie.tieId);

    if (!tieMatches.every(isEligibleMatch)) {
        return false;
    }

    const { goalsA, goalsB } = resolveAggregate(
        tieMatches,
        tie.teamAId.toString(),
        tie.teamBId.toString(),
    );

    if (goalsA !== goalsB) {
        return false;
    }

    return !tieMatches.some(
        (m) => m.tieBreak?.penaltiesHome != null && m.tieBreak?.penaltiesAway != null,
    );
}

module.exports = {
    resolveTieWinner,
    resolveAggregate,
    isTieResolved,
    needsPenalties,
    isEligibleMatch,
};
