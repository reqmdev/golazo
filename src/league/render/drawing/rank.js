/**
 * @param {number} rank
 * @param {object} theme
 */
function resolveRankColor(rank, theme) {
    if (rank === 1) return theme.rankGold;
    if (rank === 2) return theme.rankSilver;
    if (rank === 3) return theme.rankBronze;
    return theme.textMuted;
}

/**
 * @param {number} rank
 * @param {object} theme
 * @returns {string | null}
 */
function resolveQualificationColor(rank, theme) {
    if (rank === 1) return theme.rankGold;
    if (rank === 2) return theme.rankSilver;
    if (rank === 3) return theme.rankBronze;
    return null;
}

module.exports = {
    resolveRankColor,
    resolveQualificationColor
};