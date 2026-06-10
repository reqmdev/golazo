const { pairingKey } = require('./pairingKey');

/** Full-leg brute force is feasible up to this many matches (2^21 ≈ 2M combos). */
const FULL_LEG_BRUTE_FORCE_MAX = 21;

/**
 * @param {{ homeTeamId: string, awayTeamId: string }[]} fixtures
 * @param {string} teamId
 */
function getVenueBalance(fixtures, teamId) {
    let home = 0;
    let away = 0;

    for (const match of fixtures) {
        if (match.homeTeamId === teamId) home += 1;
        if (match.awayTeamId === teamId) away += 1;
    }

    return home - away;
}

/**
 * @param {{ homeTeamId: string, awayTeamId: string }[]} fixtures
 * @param {string[]} teamIds
 */
function maxVenueImbalance(fixtures, teamIds) {
    let max = 0;

    for (const id of teamIds) {
        max = Math.max(max, Math.abs(getVenueBalance(fixtures, id)));
    }

    return max;
}

/**
 * Streak counts respect bye/rest rounds (real league behaviour).
 * @param {{ homeTeamId: string, awayTeamId: string, round: number }[]} fixtures
 * @param {string[]} teamIds
 * @param {{ round: number, byeTeamId: string | null }[]} pairRounds
 * @param {number} maxStreak
 */
function hasExcessiveStreak(fixtures, teamIds, pairRounds, maxStreak = 2) {
    const byeByRound = new Map(pairRounds.map((round) => [round.round, round.byeTeamId]));
    const maxRound = Math.max(...pairRounds.map((round) => round.round));

    for (const id of teamIds) {
        let streak = 0;
        let last = null;

        for (let round = 1; round <= maxRound; round++) {
            if (byeByRound.get(round) === id) {
                streak = 0;
                last = null;
                continue;
            }

            const match = fixtures.find(
                (fixture) => fixture.round === round
                    && (fixture.homeTeamId === id || fixture.awayTeamId === id)
            );

            if (!match) {
                continue;
            }

            const venue = match.homeTeamId === id ? 'H' : 'A';
            streak = venue === last ? streak + 1 : 1;
            last = venue;

            if (streak > maxStreak) {
                return true;
            }
        }
    }

    return false;
}

/**
 * @param {{ homeTeamId: string, awayTeamId: string, round: number }[]} fixtures
 * @param {string[]} teamIds
 */
function scoreLegVenues(fixtures, teamIds) {
    let score = maxVenueImbalance(fixtures, teamIds) * 10000;

    for (const id of teamIds) {
        const ordered = fixtures
            .filter((f) => f.homeTeamId === id || f.awayTeamId === id)
            .sort((a, b) => a.round - b.round)
            .map((f) => (f.homeTeamId === id ? 'H' : 'A'));

        let streak = 0;
        let last = null;

        for (const venue of ordered) {
            streak = venue === last ? streak + 1 : 1;
            last = venue;
            score += Math.max(0, streak - 1) * 100;
        }
    }

    return score;
}

/**
 * Backtracking home/away assignment with pruning — feasible for league sizes up to 20.
 *
 * @param {{ round: number, pairs: [string, string][] }[]} pairRounds
 * @param {string[]} teamIds
 */
function assignBacktrackingVenues(pairRounds, teamIds) {
    const flat = [];
    /** @type {Record<string, number>} */
    const balance = Object.fromEntries(teamIds.map((id) => [id, 0]));
    /** @type {Record<string, number>} */
    const remaining = Object.fromEntries(teamIds.map((id) => [id, 0]));

    for (const roundData of pairRounds) {
        for (const [teamA, teamB] of roundData.pairs) {
            flat.push({ round: roundData.round, teamA, teamB });
            remaining[teamA] += 1;
            remaining[teamB] += 1;
        }
    }

    const fixtures = [];

    const canComplete = (teamId) => {
        const current = balance[teamId];
        const left = remaining[teamId];
        return current - left <= 1 && current + left >= -1;
    };

    const isFeasible = () => teamIds.every((teamId) => canComplete(teamId));

    /**
     * @param {number} index
     */
    function assignFrom(index) {
        if (index === flat.length) {
            return maxVenueImbalance(fixtures, teamIds) <= 1;
        }

        const { round, teamA, teamB } = flat[index];

        for (const [homeTeamId, awayTeamId] of [[teamA, teamB], [teamB, teamA]]) {
            balance[homeTeamId] += 1;
            balance[awayTeamId] -= 1;
            remaining[homeTeamId] -= 1;
            remaining[awayTeamId] -= 1;

            fixtures.push({
                round,
                homeTeamId,
                awayTeamId,
                pairingKey: pairingKey(teamA, teamB),
            });

            if (isFeasible() && assignFrom(index + 1)) {
                return true;
            }

            fixtures.pop();
            balance[homeTeamId] -= 1;
            balance[awayTeamId] += 1;
            remaining[homeTeamId] += 1;
            remaining[awayTeamId] += 1;
        }

        return false;
    }

    if (!assignFrom(0)) {
        throw new Error('Could not find a balanced home/away assignment for this leg.');
    }

    return fixtures;
}

/**
 * Circle-position Berger rule (scalable, deterministic).
 * @param {{ round: number, pairs: [string, string][] }[]} pairRounds
 */
function assignCirclePositionVenues(pairRounds) {
    const fixtures = [];

    for (const roundData of pairRounds) {
        const roundIndex = roundData.round - 1;

        roundData.pairs.forEach(([teamA, teamB], pairIndex) => {
            const teamAIsHome = (roundIndex + pairIndex) % 2 === 0;

            fixtures.push({
                round: roundData.round,
                homeTeamId: teamAIsHome ? teamA : teamB,
                awayTeamId: teamAIsHome ? teamB : teamA,
                pairingKey: pairingKey(teamA, teamB)
            });
        });
    }

    return fixtures;
}

/**
 * Optimal venue assignment via exhaustive search (small leagues).
 * @param {{ round: number, pairs: [string, string][] }[]} pairRounds
 * @param {string[]} teamIds
 */
function assignBruteForceVenues(pairRounds, teamIds) {
    const flat = [];

    for (const roundData of pairRounds) {
        for (const pair of roundData.pairs) {
            flat.push({ round: roundData.round, pair });
        }
    }

    const matchCount = flat.length;
    const combinations = 1 << matchCount;
    let best = null;
    let bestScore = Infinity;
    let bestKey = null;

    for (let mask = 0; mask < combinations; mask++) {
        const trial = [];

        for (let i = 0; i < matchCount; i++) {
            const [teamA, teamB] = flat[i].pair;
            const teamAIsHome = ((mask >> i) & 1) === 1;

            trial.push({
                round: flat[i].round,
                homeTeamId: teamAIsHome ? teamA : teamB,
                awayTeamId: teamAIsHome ? teamB : teamA,
                pairingKey: pairingKey(teamA, teamB)
            });
        }

        if (maxVenueImbalance(trial, teamIds) > 1) {
            continue;
        }

        if (hasExcessiveStreak(trial, teamIds, pairRounds, 2)) {
            continue;
        }

        const trialScore = scoreLegVenues(trial, teamIds);
        const trialKey = trial.map((m) => `${m.round}:${m.homeTeamId}>${m.awayTeamId}`).join('|');

        if (trialScore < bestScore || (trialScore === bestScore && (!bestKey || trialKey.localeCompare(bestKey) < 0))) {
            best = trial;
            bestScore = trialScore;
            bestKey = trialKey;
        }
    }

    if (!best) {
        throw new Error('Could not find a balanced home/away assignment for this leg.');
    }

    return best;
}

/**
 * @param {{ round: number, pairs: [string, string][] }[]} pairRounds
 * @param {string[]} teamIds
 * @returns {{ round: number, homeTeamId: string, awayTeamId: string, pairingKey: string }[]}
 */
function assignVenuesForLeg(pairRounds, teamIds) {
    const matchCount = pairRounds.reduce((sum, round) => sum + round.pairs.length, 0);

    let fixtures = matchCount <= FULL_LEG_BRUTE_FORCE_MAX
        ? assignBruteForceVenues(pairRounds, teamIds)
        : assignBacktrackingVenues(pairRounds, teamIds);

    // Polish streaks on large schedules without breaking venue balance.
    if (matchCount > FULL_LEG_BRUTE_FORCE_MAX) {
        for (let pass = 0; pass < matchCount * 2; pass++) {
            const before = scoreLegVenues(fixtures, teamIds);
            let improved = false;

            for (const match of fixtures) {
                const home = match.homeTeamId;
                const away = match.awayTeamId;
                match.homeTeamId = away;
                match.awayTeamId = home;

                const after = scoreLegVenues(fixtures, teamIds);

                if (after < before && maxVenueImbalance(fixtures, teamIds) <= 1) {
                    improved = true;
                } else {
                    match.homeTeamId = home;
                    match.awayTeamId = away;
                }
            }

            if (!improved) {
                break;
            }
        }
    }

    fixtures.sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return a.pairingKey.localeCompare(b.pairingKey);
    });

    return fixtures;
}

module.exports = {
    assignVenuesForLeg,
    assignBruteForceVenues,
    assignBacktrackingVenues,
    assignCirclePositionVenues,
    getVenueBalance,
    maxVenueImbalance,
    scoreLegVenues,
    hasExcessiveStreak,
    FULL_LEG_BRUTE_FORCE_MAX
};