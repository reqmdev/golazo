const { MATCH_STATUS } = require('../constants/matchStatus');
const { createTranslator } = require('../../i18n');

/**
 * @param {Function} [tr]
 */
function resolveTr(tr) {
    return tr || createTranslator('en');
}

/**
 * @param {{ status: string, score?: { home: number | null, away: number | null } }} match
 * @param {Function} [tr]
 */
function formatMatchScore(match, tr) {
    const t = resolveTr(tr);

    if (match.status === MATCH_STATUS.COMPLETED) {
        return `${match.score?.home ?? 0} - ${match.score?.away ?? 0}`;
    }

    if (match.status === MATCH_STATUS.WALKOVER) {
        return t('format.fixture.walkover');
    }

    if (match.status === MATCH_STATUS.POSTPONED) {
        return t('format.fixture.postponed');
    }

    if (match.status === MATCH_STATUS.CANCELLED) {
        return t('format.fixture.cancelled');
    }

    return t('format.fixture.vs');
}

/**
 * @param {object} match
 * @param {Map<string, { name: string, shortName: string }>} teamMap
 * @param {Function} [tr]
 */
function formatMatchLine(match, teamMap, tr) {
    const t = resolveTr(tr);
    const home = teamMap.get(match.homeTeamId.toString());
    const away = teamMap.get(match.awayTeamId.toString());
    const homeName = home?.shortName || home?.name || t('format.fixture.home');
    const awayName = away?.shortName || away?.name || t('format.fixture.away');
    const score = formatMatchScore(match, t);
    const legTag = match.leg > 1 ? t('format.fixture.legTag', { leg: match.leg }) : '';

    return t('format.fixture.line', { home: homeName, score, away: awayName, legTag });
}

module.exports = { formatMatchLine, formatMatchScore, resolveTr };