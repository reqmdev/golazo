const LeagueError = require('../errors/LeagueError');
const { MATCH_STATUS } = require('../constants/matchStatus');
const {
    SUBMITTABLE_STATUSES,
    CORRECTABLE_STATUSES
} = require('./constants');
const { DEFAULT_FORFEIT_SCORE } = require('../constants/defaults');

/**
 * @param {object} match
 */
function assertSubmittable(match) {
    if (!match) {
        throw new LeagueError('MATCH_NOT_FOUND');
    }

    if (!SUBMITTABLE_STATUSES.includes(match.status)) {
        throw new LeagueError('MATCH_ALREADY_PROCESSED');
    }
}

/**
 * @param {object} match
 */
function assertCorrectable(match) {
    if (!match) {
        throw new LeagueError('MATCH_NOT_FOUND');
    }

    if (!CORRECTABLE_STATUSES.includes(match.status)) {
        throw new LeagueError('MATCH_NOT_CORRECTABLE');
    }
}

/**
 * @param {object} match
 * @param {string} homeTeamId
 * @param {string} awayTeamId
 */
function assertHomeAwayAlignment(match, homeTeamId, awayTeamId) {
    if (match.homeTeamId.toString() !== homeTeamId.toString()
        || match.awayTeamId.toString() !== awayTeamId.toString()) {
        throw new LeagueError('HOME_AWAY_MISMATCH');
    }
}

/**
 * @param {number} value
 * @param {string} label
 */
function assertValidScore(value, label) {
    if (!Number.isInteger(value) || value < 0 || value > 99) {
        throw new LeagueError('INVALID_SCORE', { label });
    }
}

/**
 * @param {{ match: object, actorId: string, homeGoals: number, awayGoals: number }} input
 */
function buildSubmitUpdate(input) {
    assertValidScore(input.homeGoals, 'Home goals');
    assertValidScore(input.awayGoals, 'Away goals');

    return {
        status: MATCH_STATUS.COMPLETED,
        score: { home: input.homeGoals, away: input.awayGoals },
        meta: {
            enteredBy: input.actorId,
            enteredAt: new Date(),
            editedBy: null,
            editedAt: null,
            editReason: null,
            walkoverWinnerId: null
        }
    };
}

/**
 * @param {{ match: object, actorId: string, homeGoals: number, awayGoals: number, reason?: string }} input
 */
function buildCorrectionUpdate(input) {
    assertValidScore(input.homeGoals, 'Home goals');
    assertValidScore(input.awayGoals, 'Away goals');

    const wasWalkover = input.match.status === MATCH_STATUS.WALKOVER;

    return {
        status: wasWalkover ? MATCH_STATUS.WALKOVER : MATCH_STATUS.COMPLETED,
        score: { home: input.homeGoals, away: input.awayGoals },
        meta: {
            enteredBy: input.match.meta?.enteredBy || input.actorId,
            enteredAt: input.match.meta?.enteredAt || new Date(),
            editedBy: input.actorId,
            editedAt: new Date(),
            editReason: input.reason?.trim() || null,
            walkoverWinnerId: wasWalkover ? (input.match.meta?.walkoverWinnerId || null) : null
        }
    };
}

/**
 * Map user-entered goals to fixture home/away orientation.
 * Accepts team names entered in either order.
 *
 * @param {object} match
 * @param {object} homeTeam User-provided home team
 * @param {object} awayTeam User-provided away team
 * @param {number} homeGoals
 * @param {number} awayGoals
 */
function resolveFixtureGoals(match, homeTeam, awayTeam, homeGoals, awayGoals) {
    const fixtureHome = match.homeTeamId.toString();
    const fixtureAway = match.awayTeamId.toString();
    const userHome = homeTeam._id.toString();
    const userAway = awayTeam._id.toString();

    if (fixtureHome === userHome && fixtureAway === userAway) {
        return { homeGoals, awayGoals };
    }

    if (fixtureHome === userAway && fixtureAway === userHome) {
        return { homeGoals: awayGoals, awayGoals: homeGoals };
    }

    throw new LeagueError('TEAM_MISMATCH');
}

/**
 * @param {{ penaltiesHome: number, penaltiesAway: number }} input
 */
function buildPenaltiesUpdate(input) {
    assertValidScore(input.penaltiesHome, 'Penalties home');
    assertValidScore(input.penaltiesAway, 'Penalties away');

    if (input.penaltiesHome === input.penaltiesAway) {
        throw new LeagueError('CL_PENALTIES_DRAW');
    }

    return {
        tieBreak: {
            penaltiesHome: input.penaltiesHome,
            penaltiesAway: input.penaltiesAway,
            decidedBy: 'penalties',
        },
    };
}

/**
 * @param {{ match: object, actorId: string, winnerTeamId: string }} input
 */
function buildForfeitUpdate(input) {
    const homeId = input.match.homeTeamId.toString();
    const awayId = input.match.awayTeamId.toString();
    const winnerId = input.winnerTeamId.toString();

    if (winnerId !== homeId && winnerId !== awayId) {
        throw new LeagueError('INVALID_FORFEIT_TEAMS');
    }

    const homeWins = winnerId === homeId;

    return {
        status: MATCH_STATUS.WALKOVER,
        score: {
            home: homeWins ? DEFAULT_FORFEIT_SCORE.winnerGoals : DEFAULT_FORFEIT_SCORE.loserGoals,
            away: homeWins ? DEFAULT_FORFEIT_SCORE.loserGoals : DEFAULT_FORFEIT_SCORE.winnerGoals
        },
        meta: {
            enteredBy: input.actorId,
            enteredAt: new Date(),
            editedBy: null,
            editedAt: null,
            editReason: null,
            walkoverWinnerId: winnerId
        }
    };
}

module.exports = {
    assertSubmittable,
    assertCorrectable,
    assertHomeAwayAlignment,
    assertValidScore,
    buildSubmitUpdate,
    buildCorrectionUpdate,
    buildPenaltiesUpdate,
    buildForfeitUpdate,
    resolveFixtureGoals
};