const { MATCH_STATUS } = require('../../constants/matchStatus');
const { createTranslator } = require('../../../i18n');

/**
 * @param {Function} tr
 * @param {object} league
 * @param {object} match
 */
function buildMatchResultLabels(tr, league, match) {
    const subtitle = match.leg > 1
        ? tr('render.matchResult.roundLegWithLeg', { round: match.round, leg: match.leg })
        : tr('render.matchResult.roundLeg', { round: match.round });

    return {
        subtitle,
        draw: tr('render.matchResult.draw'),
        wins: (name) => tr('render.matchResult.wins', { name })
    };
}

/**
 * @param {object} league
 * @param {object} match
 * @param {Map<string, object>} teamMap
 * @param {{ label?: string, tr?: Function }} [options]
 */
function buildMatchResultView(league, match, teamMap, options = {}) {
    const tr = options.tr || createTranslator('en');
    const home = teamMap.get(match.homeTeamId.toString()) || {};
    const away = teamMap.get(match.awayTeamId.toString()) || {};

    const homeGoals = match.score?.home ?? 0;
    const awayGoals = match.score?.away ?? 0;

    let resultLabel = options.label || tr('render.matchResult.fullTime');

    if (match.status === MATCH_STATUS.WALKOVER) {
        resultLabel = tr('render.matchResult.walkover');
    }

    let winner = 'draw';

    if (homeGoals > awayGoals) winner = 'home';
    else if (awayGoals > homeGoals) winner = 'away';
    else if (match.status === MATCH_STATUS.WALKOVER) {
        const walkoverWinner = match.meta?.walkoverWinnerId?.toString();
        if (walkoverWinner === match.homeTeamId.toString()) winner = 'home';
        else if (walkoverWinner === match.awayTeamId.toString()) winner = 'away';
    }

    return {
        type: 'match_result',
        league: {
            id: league._id.toString(),
            name: league.name,
            slug: league.slug,
            season: league.season
        },
        match: {
            id: match._id.toString(),
            round: match.round,
            leg: match.leg,
            status: match.status,
            homeGoals,
            awayGoals,
            scoreText: `${homeGoals} - ${awayGoals}`,
            resultLabel,
            winner
        },
        home: {
            id: match.homeTeamId.toString(),
            name: home.name || tr('common.home'),
            shortName: home.shortName || '',
            color: home.colors?.primary || null,
            logoUrl: home.logoUrl || null
        },
        away: {
            id: match.awayTeamId.toString(),
            name: away.name || tr('common.away'),
            shortName: away.shortName || '',
            color: away.colors?.primary || null,
            logoUrl: away.logoUrl || null
        },
        labels: buildMatchResultLabels(tr, league, match)
    };
}

module.exports = { buildMatchResultView, buildMatchResultLabels };