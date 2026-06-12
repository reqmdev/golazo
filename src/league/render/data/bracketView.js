const { createTranslator } = require('../../../i18n');

/**
 * @param {object} tournament
 * @param {Map<string, object>} teamMap
 * @param {object[]} matches
 * @param {{ tr?: Function }} [options]
 */
function buildBracketView(tournament, teamMap, matches, options = {}) {
    const tr = options.tr || createTranslator('en');
    const rounds = ['playoff', 'r16', 'qf', 'sf', 'final'];

    /** @type {object[]} */
    const roundViews = [];

    for (const round of rounds) {
        const ties = (tournament.knockoutTies || []).filter((t) => t.round === round);

        if (!ties.length) {
            continue;
        }

        roundViews.push({
            round,
            label: tr(`handlers.champions.round.${round}`),
            ties: ties.map((tie) => ({
                tieId: tie.tieId,
                teamA: teamMap.get(tie.teamAId?.toString()) || null,
                teamB: teamMap.get(tie.teamBId?.toString()) || null,
                winnerId: tie.winnerId?.toString() || null,
                isBye: tie.isBye,
                matches: matches.filter((m) => m.tieId === tie.tieId),
            })),
        });
    }

    return {
        type: 'champions_bracket',
        tournamentId: tournament._id.toString(),
        status: tournament.status,
        rounds: roundViews,
        winnerTeamId: tournament.winnerTeamId?.toString() || null,
    };
}

module.exports = {
    buildBracketView,
};
