const {
    resolveMatchGoals,
    deriveOutcome,
    isStandingsEligible
} = require('../match/matchResult');
const { rankEntries, normalizeTiebreakers } = require('./standingCalculator');

/**
 * Incremental standings are safe only without head_to_head tiebreakers.
 * @param {string[]} tiebreakers
 */
function canUseIncrementalStandings(tiebreakers) {
    return !normalizeTiebreakers(tiebreakers).includes('head_to_head');
}

/**
 * @param {boolean} enabled
 */
function isIncrementalStandingsEnabled(enabled = process.env.GOLAZO_INCREMENTAL_STANDINGS === 'true') {
    return enabled;
}

/**
 * @param {object[]} entries
 */
function cloneEntries(entries) {
    return entries.map((entry) => ({
        ...entry,
        teamId: entry.teamId,
        form: [...(entry.form || [])]
    }));
}

/**
 * @param {object[]} entries
 * @param {object} match
 * @param {{ pointsWin: number, pointsDraw: number, pointsLoss: number }} pointsRules
 * @param {object} forfeitScore
 * @param {'add' | 'remove'} mode
 */
function applyMatchDelta(entries, match, pointsRules, forfeitScore, mode) {
    if (!isStandingsEligible(match)) {
        return entries;
    }

    const goals = resolveMatchGoals(match, forfeitScore);

    if (!goals) {
        return entries;
    }

    const factor = mode === 'remove' ? -1 : 1;
    const homeId = match.homeTeamId.toString();
    const awayId = match.awayTeamId.toString();
    const outcome = deriveOutcome(goals.home, goals.away, pointsRules);

    return entries.map((entry) => {
        const id = entry.teamId.toString();

        if (id !== homeId && id !== awayId) {
            return entry;
        }

        const isHome = id === homeId;
        const side = isHome ? outcome.home : outcome.away;
        const next = { ...entry, form: [...(entry.form || [])] };

        next.played += factor;
        next.gf += factor * (isHome ? goals.home : goals.away);
        next.ga += factor * (isHome ? goals.away : goals.home);
        next.gd = next.gf - next.ga;
        next.points += factor * side.points;

        if (side.result === 'W') {
            next.won += factor;
        } else if (side.result === 'L') {
            next.lost += factor;
        } else {
            next.drawn += factor;
        }

        if (factor > 0) {
            next.form.push(side.result);
            if (next.form.length > 5) {
                next.form = next.form.slice(-5);
            }
        } else {
            next.form.pop();
        }

        return next;
    });
}

/**
 * Apply a single match change on top of materialized standings, then re-rank.
 *
 * @param {object[]} existingEntries
 * @param {object} updatedMatch
 * @param {object | null} previousMatch
 * @param {object[]} allMatches
 * @param {object} league
 * @param {object} forfeitScore
 */
function incrementalStandingsUpdate(
    existingEntries,
    updatedMatch,
    previousMatch,
    allMatches,
    league,
    forfeitScore
) {
    if (!existingEntries?.length) {
        return null;
    }

    if (!canUseIncrementalStandings(league.tiebreakers || [])) {
        return null;
    }

    const pointsRules = {
        pointsWin: league.settings.pointsWin,
        pointsDraw: league.settings.pointsDraw,
        pointsLoss: league.settings.pointsLoss
    };

    let entries = cloneEntries(existingEntries);

    if (previousMatch && isStandingsEligible(previousMatch)) {
        entries = applyMatchDelta(entries, previousMatch, pointsRules, forfeitScore, 'remove');
    }

    if (isStandingsEligible(updatedMatch)) {
        entries = applyMatchDelta(entries, updatedMatch, pointsRules, forfeitScore, 'add');
    }

    const ranked = rankEntries(
        entries,
        league.tiebreakers || [],
        allMatches,
        forfeitScore,
        pointsRules
    );

    return ranked.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));
}

module.exports = {
    canUseIncrementalStandings,
    isIncrementalStandingsEnabled,
    applyMatchDelta,
    incrementalStandingsUpdate
};