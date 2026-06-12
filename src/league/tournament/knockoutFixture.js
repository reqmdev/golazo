const { COMPETITION_PHASE } = require('../fixture/constants');
const { makeTieId } = require('./knockoutBracket');

/**
 * Build match documents for knockout ties.
 *
 * @param {object} input
 * @param {object[]} input.ties
 * @param {string} input.tournamentId
 * @param {string} input.leagueId
 * @param {string} input.guildId
 * @param {boolean} [input.twoLeggedKnockout]
 * @param {boolean} [input.twoLeggedFinal]
 */
function buildKnockoutFixtures(input) {
    const {
        ties,
        tournamentId,
        leagueId,
        guildId,
        twoLeggedKnockout = true,
        twoLeggedFinal = false,
    } = input;

    /** @type {object[]} */
    const fixtures = [];
    let roundCounter = 1;

    for (const tie of ties) {
        if (tie.isBye || !tie.teamAId || !tie.teamBId) {
            continue;
        }

        const isFinal = tie.round === 'final';
        const twoLegged = isFinal ? twoLeggedFinal : twoLeggedKnockout;

        fixtures.push({
            leagueId,
            guildId,
            tournamentId,
            round: roundCounter,
            leg: 1,
            competitionPhase: COMPETITION_PHASE.CHAMPIONS_KNOCKOUT,
            groupId: null,
            pairingKey: `${tie.teamAId}:${tie.teamBId}`,
            homeTeamId: tie.teamAId,
            awayTeamId: tie.teamBId,
            tieId: tie.tieId,
            knockoutRound: tie.round,
            status: 'scheduled',
        });

        if (twoLegged) {
            fixtures.push({
                leagueId,
                guildId,
                tournamentId,
                round: roundCounter,
                leg: 2,
                competitionPhase: COMPETITION_PHASE.CHAMPIONS_KNOCKOUT,
                groupId: null,
                pairingKey: `${tie.teamBId}:${tie.teamAId}`,
                homeTeamId: tie.teamBId,
                awayTeamId: tie.teamAId,
                tieId: tie.tieId,
                knockoutRound: tie.round,
                status: 'scheduled',
            });
        }

        roundCounter += 1;
    }

    return fixtures;
}

/**
 * Build final tie between playoff winner and seed 1.
 *
 * @param {object} input
 */
function buildFinalFromPlayoff(input) {
    const { tournamentId, leagueId, guildId, teamAId, teamBId, twoLeggedFinal = false } = input;
    const tieId = makeTieId('final', 0);
    /** @type {object[]} */
    const fixtures = [{
        leagueId,
        guildId,
        tournamentId,
        round: 1,
        leg: 1,
        competitionPhase: COMPETITION_PHASE.CHAMPIONS_KNOCKOUT,
        groupId: null,
        pairingKey: `${teamAId}:${teamBId}`,
        homeTeamId: teamAId,
        awayTeamId: teamBId,
        tieId,
        knockoutRound: 'final',
        status: 'scheduled',
    }];

    if (twoLeggedFinal) {
        fixtures.push({
            leagueId,
            guildId,
            tournamentId,
            round: 1,
            leg: 2,
            competitionPhase: COMPETITION_PHASE.CHAMPIONS_KNOCKOUT,
            groupId: null,
            pairingKey: `${teamBId}:${teamAId}`,
            homeTeamId: teamBId,
            awayTeamId: teamAId,
            tieId,
            knockoutRound: 'final',
            status: 'scheduled',
        });
    }

    return { tieId, fixtures };
}

module.exports = {
    buildKnockoutFixtures,
    buildFinalFromPlayoff,
};
