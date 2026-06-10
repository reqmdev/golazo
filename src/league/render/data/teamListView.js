const { createTranslator } = require('../../../i18n');

/**
 * @param {Function} tr
 * @param {object} league
 * @param {number} teamCount
 */
function buildTeamListLabels(tr, league, teamCount) {
    return {
        subtitle: tr('render.teams.subtitle', { status: league.status || 'registration' }),
        empty: tr('render.teams.empty'),
        badgeTeams: tr('render.teams.badgeTeams', { count: teamCount }),
        badgePage: (page, totalPages) => tr('render.teams.badgePage', { page, totalPages }),
        footerPage: (page, totalPages) => tr('render.teams.footerPage', { page, totalPages }),
        columns: {
            team: tr('render.teams.columns.team'),
            captain: tr('render.teams.columns.captain'),
            role: tr('render.teams.columns.role'),
            colors: tr('render.teams.columns.colors')
        }
    };
}

/**
 * @param {object} league
 * @param {object[]} teams
 * @param {{ page?: number, tr?: Function, captainLabels?: Map<string, string>, roleLabels?: Map<string, string> }} [options]
 */
function buildTeamListView(league, teams, options = {}) {
    const tr = options.tr || createTranslator('en');
    const dash = tr('common.emDash');
    const captainLabels = options.captainLabels || new Map();
    const roleLabels = options.roleLabels || new Map();

    const rows = teams.map((team) => {
        const id = team._id.toString();

        return {
            team: {
                id,
                name: team.name,
                shortName: team.shortName || '',
                color: team.colors?.primary || null,
                secondaryColor: team.colors?.secondary || null,
                logoUrl: team.logoUrl || null
            },
            captain: team.captainId ? (captainLabels.get(id) || dash) : dash,
            role: team.roleId ? (roleLabels.get(id) || dash) : dash
        };
    });

    return {
        type: 'team_list',
        league: {
            id: league._id.toString(),
            name: league.name,
            slug: league.slug,
            status: league.status,
            season: league.season
        },
        rows,
        page: options.page ?? 1,
        labels: buildTeamListLabels(tr, league, rows.length)
    };
}

module.exports = { buildTeamListView, buildTeamListLabels };