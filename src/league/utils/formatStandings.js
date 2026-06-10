const { createTranslator } = require('../../i18n');

/**
 * @param {Function} [tr]
 */
function resolveTr(tr) {
    return tr || createTranslator('en');
}

/**
 * @param {object} standing
 * @param {Map<string, { name: string, shortName: string }>} teamMap
 * @param {Function} [tr]
 */
function formatStandingsTable(standing, teamMap, tr) {
    const t = resolveTr(tr);

    if (!standing?.entries?.length) {
        return t('format.standings.empty');
    }

    const header = `\`\`\`\n${t('format.standings.header')}`;
    const lines = standing.entries.map((entry) => {
        const team = teamMap.get(entry.teamId.toString());
        const name = (team?.shortName || team?.name || t('format.standings.unknownTeam'))
            .padEnd(14, ' ')
            .slice(0, 14);

        return [
            String(entry.rank).padStart(2, ' '),
            name,
            String(entry.played).padStart(2, ' '),
            String(entry.won).padStart(2, ' '),
            String(entry.drawn).padStart(2, ' '),
            String(entry.lost).padStart(2, ' '),
            String(entry.gf).padStart(2, ' '),
            String(entry.ga).padStart(2, ' '),
            String(entry.gd).padStart(3, ' '),
            String(entry.points).padStart(2, ' ')
        ].join(' ');
    });

    return `${header}\n${lines.join('\n')}\n\`\`\``;
}

module.exports = { formatStandingsTable };