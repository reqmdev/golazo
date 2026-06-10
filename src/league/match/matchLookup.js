const LeagueError = require('../errors/LeagueError');

/**
 * Pick exactly one match from candidates; throws on ambiguity.
 *
 * @param {object[]} candidates
 * @param {{ round?: number | null, actionLabel?: string }} options
 */
function pickUniqueMatch(candidates, { round = null, actionLabel = 'match' } = {}) {
    if (!candidates.length) {
        return null;
    }

    if (round !== null && round !== undefined) {
        const roundMatches = candidates.filter((entry) => entry.round === round);

        if (roundMatches.length === 0) {
            return null;
        }

        if (roundMatches.length > 1) {
            throw new LeagueError('AMBIGUOUS_MATCH_ROUND', { round });
        }

        return roundMatches[0];
    }

    if (candidates.length === 1) {
        return candidates[0];
    }

    const rounds = [...new Set(candidates.map((entry) => entry.round))].sort((a, b) => a - b);

    throw new LeagueError('AMBIGUOUS_MATCH_ROUNDS', {
        actionLabel,
        rounds: rounds.join(', ')
    });
}

/**
 * @param {string} homeName
 * @param {string} awayName
 */
function assertDistinctTeams(homeName, awayName) {
    const home = homeName?.trim();
    const away = awayName?.trim();

    if (!home || !away) {
        throw new LeagueError('INVALID_TEAMS_BOTH');
    }

    if (home.toLowerCase() === away.toLowerCase()) {
        throw new LeagueError('INVALID_TEAMS_SAME');
    }

    return { home, away };
}

module.exports = {
    pickUniqueMatch,
    assertDistinctTeams
};