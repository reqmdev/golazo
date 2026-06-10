const { MATCH_STATUS } = require('../../constants/matchStatus');
const { formatMatchScore } = require('../../utils/formatFixture');
const { createTranslator } = require('../../../i18n');

/**
 * @param {Function} tr
 * @param {object} league
 * @param {number} round
 * @param {number} matchCount
 */
function buildFixtureLabels(tr, league, round, matchCount) {
    return {
        subtitle: tr('render.fixture.subtitle', { round, totalRounds: league.totalRounds }),
        empty: tr('render.fixture.empty'),
        badgeMatches: tr('render.fixture.badgeMatches', { count: matchCount }),
        badgePage: (page, totalPages) => tr('render.fixture.badgePage', { page, totalPages }),
        footerPage: (page, totalPages) => tr('render.fixture.footerPage', { page, totalPages }),
        bye: (teams) => tr('render.fixture.bye', { teams }),
        leg: (leg) => tr('render.fixture.leg', { leg }),
        played: tr('render.fixture.played'),
        upcoming: tr('render.fixture.upcoming')
    };
}

/**
 * @param {object} league
 * @param {number} round
 * @param {object[]} matches
 * @param {Map<string, object>} teamMap
 * @param {string[]} byeTeams
 * @param {{ tr?: Function }} [options]
 */
function buildFixtureView(league, round, matches, teamMap, byeTeams = [], options = {}) {
    const tr = options.tr || createTranslator('en');

    const rows = matches.map((match) => {
        const home = teamMap.get(match.homeTeamId.toString()) || {};
        const away = teamMap.get(match.awayTeamId.toString()) || {};

        return {
            id: match._id.toString(),
            round: match.round,
            leg: match.leg,
            status: match.status,
            scoreText: formatMatchScore(match, tr),
            isPlayed: [MATCH_STATUS.COMPLETED, MATCH_STATUS.WALKOVER].includes(match.status),
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
            }
        };
    });

    return {
        type: 'fixture',
        league: {
            id: league._id.toString(),
            name: league.name,
            slug: league.slug,
            totalRounds: league.totalRounds,
            currentRound: league.currentRound
        },
        round,
        rows,
        byeTeams,
        matchCount: rows.length,
        labels: buildFixtureLabels(tr, league, round, rows.length)
    };
}

module.exports = { buildFixtureView, buildFixtureLabels };