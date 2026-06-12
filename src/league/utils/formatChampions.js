const { resolveAggregate, resolveTieWinner } = require('../tournament/tieResolver');
const { TOURNAMENT_STATUS } = require('../constants/tournamentStatus');

/**
 * @param {object} tournament
 * @param {Map<string, object>} teamMap
 * @param {object[]} matches
 * @param {Function} tr
 */
function formatKnockoutBracket(tournament, teamMap, matches, tr) {
    if (!tournament.knockoutTies?.length) {
        return tr('handlers.champions.bracket.empty');
    }

    const lines = [`\`\`\``];
    const roundOrder = ['playoff', 'r16', 'qf', 'sf', 'final'];
    const byRound = new Map();

    for (const tie of tournament.knockoutTies) {
        if (!byRound.has(tie.round)) {
            byRound.set(tie.round, []);
        }

        byRound.get(tie.round).push(tie);
    }

    for (const round of roundOrder) {
        const ties = byRound.get(round);

        if (!ties?.length) {
            continue;
        }

        lines.push(tr(`handlers.champions.round.${round}`));

        for (const tie of ties.sort((a, b) => a.slot - b.slot)) {
            const nameA = teamMap.get(tie.teamAId?.toString())?.name || tr('common.tbd');
            const nameB = teamMap.get(tie.teamBId?.toString())?.name || tr('common.tbd');

            if (tie.isBye) {
                lines.push(`  ${nameA} (${tr('handlers.champions.bye')})`);
                continue;
            }

            const tieMatches = matches.filter((m) => m.tieId === tie.tieId);
            const { goalsA, goalsB } = resolveAggregate(tieMatches, tie.teamAId, tie.teamBId);
            const winnerId = resolveTieWinner(tie, tieMatches);
            const winnerMark = (id) => (id === winnerId?.toString() ? '*' : ' ');

            lines.push(
                `  ${winnerMark(tie.teamAId?.toString())}${nameA} ${goalsA}-${goalsB} ${nameB}${winnerMark(tie.teamBId?.toString())}`,
            );
        }

        lines.push('');
    }

    lines.push('```');

    return lines.join('\n');
}

/**
 * @param {object} tournament
 * @param {Function} tr
 */
function formatTournamentStatus(tournament, tr) {
    const statusKey = `handlers.champions.status.${tournament.status}`;
    let detail = tr(statusKey);

    if (tournament.status === TOURNAMENT_STATUS.GROUP_STAGE) {
        detail += ` · ${tr('handlers.champions.phase.group')}`;
    } else if (tournament.status === TOURNAMENT_STATUS.KNOCKOUT) {
        detail += ` · ${tr('handlers.champions.round.' + (tournament.currentKnockoutRound || 'final'))}`;
    } else if (tournament.status === TOURNAMENT_STATUS.COMPLETED && tournament.winnerTeamId) {
        detail += ` · ${tr('handlers.champions.winnerSet')}`;
    }

    return detail;
}

module.exports = {
    formatKnockoutBracket,
    formatTournamentStatus,
};
