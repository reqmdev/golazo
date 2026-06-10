const {
    dedupeMatches,
    sortMatchesForProcessing,
    resolveMatchGoals,
    deriveOutcome,
    isStandingsEligible
} = require('../match/matchResult');
const { ALLOWED_TIEBREAKERS } = require('../constants/defaults');

/**
 * Pure standings rebuild — deterministic, idempotent, full rollback via recompute.
 *
 * @param {object[]} teams Active teams
 * @param {object[]} matches All league matches (ineligible statuses ignored)
 * @param {{ pointsWin: number, pointsDraw: number, pointsLoss: number }} pointsRules
 * @param {string[]} tiebreakers
 * @param {{ winnerGoals?: number, loserGoals?: number }} forfeitScore
 */
function calculateStandings(teams, matches, pointsRules, tiebreakers, forfeitScore) {
    /** @type {Map<string, object>} */
    const table = new Map();

    const sortedTeams = [...teams].sort(
        (a, b) => a._id.toString().localeCompare(b._id.toString())
    );

    for (const team of sortedTeams) {
        table.set(team._id.toString(), {
            teamId: team._id,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0,
            form: []
        });
    }

    const eligible = dedupeMatches(matches).filter(isStandingsEligible);
    const ordered = sortMatchesForProcessing(eligible);

    for (const match of ordered) {
        const goals = resolveMatchGoals(match, forfeitScore);

        if (!goals) {
            continue;
        }

        const homeId = match.homeTeamId.toString();
        const awayId = match.awayTeamId.toString();
        const home = table.get(homeId);
        const away = table.get(awayId);

        if (!home || !away) {
            continue;
        }

        const outcome = deriveOutcome(goals.home, goals.away, pointsRules);

        home.played += 1;
        away.played += 1;
        home.gf += goals.home;
        home.ga += goals.away;
        away.gf += goals.away;
        away.ga += goals.home;

        if (outcome.home.result === 'W') {
            home.won += 1;
            away.lost += 1;
        } else if (outcome.home.result === 'L') {
            home.lost += 1;
            away.won += 1;
        } else {
            home.drawn += 1;
            away.drawn += 1;
        }

        home.points += outcome.home.points;
        away.points += outcome.away.points;
        home.form.push(outcome.home.result);
        away.form.push(outcome.away.result);

        if (home.form.length > 5) home.form = home.form.slice(-5);
        if (away.form.length > 5) away.form = away.form.slice(-5);
    }

    const entries = [...table.values()].map((entry) => ({
        ...entry,
        gd: entry.gf - entry.ga
    }));

    const ranked = rankEntries(entries, tiebreakers, ordered, forfeitScore, pointsRules);

    return ranked.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));
}

/**
 * @param {object[]} entries
 * @param {string[]} tiebreakers
 * @param {object[]} orderedMatches
 * @param {object} forfeitScore
 */
function normalizeTiebreakers(tiebreakers) {
    const rules = [...(tiebreakers || [])].filter((rule) => ALLOWED_TIEBREAKERS.includes(rule));

    if (!rules.includes('team_id')) {
        rules.push('team_id');
    }

    return rules;
}

function rankEntries(entries, tiebreakers, orderedMatches, forfeitScore, pointsRules) {
    const rules = normalizeTiebreakers(tiebreakers);

    return [...entries].sort(
        (a, b) => compareEntries(a, b, rules, orderedMatches, forfeitScore, pointsRules)
    );
}

/**
 * Negative return value => a ranks higher.
 */
function compareEntries(a, b, tiebreakers, matches, forfeitScore, pointsRules) {
    for (const rule of tiebreakers) {
        const diff = applyTiebreaker(a, b, rule, matches, forfeitScore, pointsRules);

        if (diff !== 0) {
            return diff;
        }
    }

    return 0;
}

function applyTiebreaker(a, b, rule, matches, forfeitScore, pointsRules) {
    switch (rule) {
        case 'points':
            return b.points - a.points;
        case 'gd':
            return b.gd - a.gd;
        case 'gf':
            return b.gf - a.gf;
        case 'head_to_head':
            return headToHeadPoints(b, a, matches, forfeitScore, pointsRules);
        case 'team_id':
            return a.teamId.toString().localeCompare(b.teamId.toString());
        default:
            return 0;
    }
}

/**
 * Returns bPoints - aPoints style for consistent compareEntries usage.
 */
function headToHeadPoints(teamA, teamB, matches, forfeitScore, pointsRules) {
    const teamAId = teamA.teamId.toString();
    const teamBId = teamB.teamId.toString();
    let aPoints = 0;
    let bPoints = 0;

    for (const match of matches) {
        const home = match.homeTeamId.toString();
        const away = match.awayTeamId.toString();

        if (![home, away].includes(teamAId) || ![home, away].includes(teamBId)) {
            continue;
        }

        const goals = resolveMatchGoals(match, forfeitScore);

        if (!goals) {
            continue;
        }

        const outcome = deriveOutcome(goals.home, goals.away, pointsRules);

        const aIsHome = home === teamAId;
        const aOutcome = aIsHome ? outcome.home : outcome.away;
        const bOutcome = aIsHome ? outcome.away : outcome.home;

        aPoints += aOutcome.points;
        bPoints += bOutcome.points;
    }

    return bPoints - aPoints;
}

module.exports = {
    calculateStandings,
    rankEntries,
    compareEntries,
    headToHeadPoints,
    normalizeTiebreakers
};