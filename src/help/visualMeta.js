const { PAGE_ACCENTS, BRAND } = require('../canvas/tokens');

/** @type {Record<string, { accent: string, emoji: string, step?: number, group?: string }>} */
const PAGE_VISUALS = {
    overview: { accent: PAGE_ACCENTS.overview, emoji: '🏠', group: 'hub' },
    league_step_1: { accent: PAGE_ACCENTS.league_step_1, emoji: '1️⃣', step: 1, group: 'league' },
    league_step_2: { accent: PAGE_ACCENTS.league_step_2, emoji: '2️⃣', step: 2, group: 'league' },
    league_step_3: { accent: PAGE_ACCENTS.league_step_3, emoji: '3️⃣', step: 3, group: 'league' },
    league_step_4: { accent: PAGE_ACCENTS.league_step_4, emoji: '4️⃣', step: 4, group: 'league' },
    league_step_5: { accent: PAGE_ACCENTS.league_step_5, emoji: '5️⃣', step: 5, group: 'league' },
    league_step_6: { accent: PAGE_ACCENTS.league_step_6, emoji: '6️⃣', step: 6, group: 'league' },
    teams: { accent: PAGE_ACCENTS.teams, emoji: '👥', group: 'teams' },
    matches: { accent: PAGE_ACCENTS.matches, emoji: '⚽', group: 'matches' },
    admin: { accent: PAGE_ACCENTS.admin, emoji: '🛡️', group: 'admin' },
    commands: { accent: PAGE_ACCENTS.commands, emoji: '⌨️', group: 'commands' },
    tips: { accent: PAGE_ACCENTS.tips, emoji: '💡', group: 'tips' }
};

const BRAND_MARK = { accent: BRAND.green, emoji: '⚽' };

module.exports = {
    PAGE_VISUALS,
    BRAND_MARK,
    getPageVisual(pageId) {
        return PAGE_VISUALS[pageId] || PAGE_VISUALS.overview;
    }
};