const { createTranslator } = require('../../../i18n');
const { buildStandingsView } = require('./standingsView');

/**
 * @param {object} league
 * @param {object} groupStanding
 * @param {Map<string, object>} teamMap
 * @param {string} groupId
 * @param {{ tr?: Function }} [options]
 */
function buildGroupStandingsView(league, groupStanding, teamMap, groupId, options = {}) {
    const tr = options.tr || createTranslator('en');
    const base = buildStandingsView(league, groupStanding, teamMap, { tr, page: 1 });

    return {
        ...base,
        type: 'champions_group',
        groupId,
        league: {
            ...base.league,
            name: `${league.name} — ${tr('handlers.champions.groupTitle', { group: groupId })}`,
        },
    };
}

module.exports = {
    buildGroupStandingsView,
};
