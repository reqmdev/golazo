const { createTranslator } = require('../../../i18n');

/**
 * @param {Function} tr
 * @param {object} league
 * @param {number} teamCount
 */
function buildStandingsLabels(tr, league, teamCount) {
    return {
        subtitle: tr('render.standings.subtitle', { season: league.season }),
        empty: tr('render.standings.empty'),
        badgeTeams: tr('render.standings.badgeTeams', { count: teamCount }),
        badgePage: (page, totalPages) => tr('render.standings.badgePage', { page, totalPages }),
        footerPage: (page, totalPages) => tr('render.standings.footerPage', { page, totalPages }),
        columns: {
            rank: tr('render.standings.columns.rank'),
            team: tr('render.standings.columns.team'),
            played: tr('render.standings.columns.played'),
            won: tr('render.standings.columns.won'),
            drawn: tr('render.standings.columns.drawn'),
            lost: tr('render.standings.columns.lost'),
            gf: tr('render.standings.columns.gf'),
            ga: tr('render.standings.columns.ga'),
            gd: tr('render.standings.columns.gd'),
            points: tr('render.standings.columns.points'),
            form: tr('render.standings.columns.form')
        }
    };
}

/**
 * Pure view-model builder — no canvas/render dependencies.
 *
 * @param {object} league
 * @param {object} standing
 * @param {Map<string, object>} teamMap
 * @param {{ page?: number, tr?: Function }} [options]
 */
function buildStandingsView(league, standing, teamMap, options = {}) {
    const tr = options.tr || createTranslator('en');
    const entries = standing?.entries || [];

    const rows = entries.map((entry) => {
        const team = teamMap.get(entry.teamId.toString()) || {};
        const displayName = team.shortName
            ? `${team.name} (${team.shortName})`
            : team.name || tr('common.unknown');

        return {
            rank: entry.rank,
            team: {
                id: entry.teamId.toString(),
                name: team.name || tr('common.unknown'),
                displayName,
                shortName: team.shortName || '',
                color: team.colors?.primary || null,
                logoUrl: team.logoUrl || null,
                form: entry.form || []
            },
            played: entry.played,
            won: entry.won,
            drawn: entry.drawn,
            lost: entry.lost,
            gf: entry.gf,
            ga: entry.ga,
            gd: entry.gd >= 0 ? `+${entry.gd}` : String(entry.gd),
            points: entry.points,
            form: entry.form || []
        };
    });

    return {
        type: 'standings',
        league: {
            id: league._id.toString(),
            name: league.name,
            slug: league.slug,
            season: league.season,
            format: league.format
        },
        meta: {
            calculatedAt: standing?.calculatedAt || null,
            version: standing?.version || 0,
            teamCount: rows.length
        },
        rows,
        page: options.page ?? 1,
        labels: buildStandingsLabels(tr, league, rows.length)
    };
}

module.exports = { buildStandingsView, buildStandingsLabels };