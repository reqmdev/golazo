/**
 * Canonical unordered pairing key for duplicate detection.
 * @param {string} teamA
 * @param {string} teamB
 * @returns {string}
 */
function pairingKey(teamA, teamB) {
    const a = teamA.toString();
    const b = teamB.toString();
    return a < b ? `${a}:${b}` : `${b}:${a}`;
}

module.exports = { pairingKey };