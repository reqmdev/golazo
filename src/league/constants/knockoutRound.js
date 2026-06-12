const KNOCKOUT_ROUND = {
    PLAYOFF: 'playoff',
    R16: 'r16',
    QF: 'qf',
    SF: 'sf',
    FINAL: 'final',
};

/** Ordered knockout rounds from earliest to latest. */
const KNOCKOUT_ROUND_ORDER = [
    KNOCKOUT_ROUND.PLAYOFF,
    KNOCKOUT_ROUND.R16,
    KNOCKOUT_ROUND.QF,
    KNOCKOUT_ROUND.SF,
    KNOCKOUT_ROUND.FINAL,
];

/**
 * @param {string} round
 */
function nextKnockoutRound(round) {
    const index = KNOCKOUT_ROUND_ORDER.indexOf(round);

    if (index < 0 || index >= KNOCKOUT_ROUND_ORDER.length - 1) {
        return null;
    }

    return KNOCKOUT_ROUND_ORDER[index + 1];
}

module.exports = {
    KNOCKOUT_ROUND,
    KNOCKOUT_ROUND_ORDER,
    nextKnockoutRound,
};
