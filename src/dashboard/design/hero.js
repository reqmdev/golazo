const fs = require('fs');
const path = require('path');
const { ASSETS_ROOT } = require('../../help/renderHelpAssets');
const { DASHBOARD_VIEWS } = require('../constants');

/** Maps dashboard views to cached help footer assets. */
const VIEW_HERO_PAGES = {
    [DASHBOARD_VIEWS.HUB]: 'overview',
    [DASHBOARD_VIEWS.LEAGUE]: 'league_step_1',
    [DASHBOARD_VIEWS.TEAMS]: 'teams',
    [DASHBOARD_VIEWS.FIXTURE]: 'league_step_4',
    [DASHBOARD_VIEWS.SCORE]: 'matches',
    [DASHBOARD_VIEWS.STANDINGS]: 'league_step_6',
    [DASHBOARD_VIEWS.SETTINGS]: 'admin',
    [DASHBOARD_VIEWS.MATCH_OPS]: 'league_step_5',
    [DASHBOARD_VIEWS.ADMIN]: 'admin',
};

const HERO_CACHE = new Map();

/**
 * @param {string} pageId
 */
function readCachedHeroBuffer(pageId) {
    for (const locale of ['en', 'tr']) {
        const cachePath = path.join(ASSETS_ROOT, 'cache', locale, `${pageId}-footer.png`);

        if (fs.existsSync(cachePath)) {
            return fs.readFileSync(cachePath);
        }
    }

    return null;
}

/**
 * Disk-only hero lookup — never renders at request time.
 *
 * @param {string} view
 */
function resolveDashboardHero(view) {
    const pageId = VIEW_HERO_PAGES[view] ?? 'overview';

    if (HERO_CACHE.has(pageId)) {
        return {
            buffer: HERO_CACHE.get(pageId),
            filename: `dashboard-hero-${view}.png`,
        };
    }

    const buffer = readCachedHeroBuffer(pageId);

    if (!buffer) {
        return null;
    }

    HERO_CACHE.set(pageId, buffer);

    return {
        buffer,
        filename: `dashboard-hero-${view}.png`,
    };
}

module.exports = {
    VIEW_HERO_PAGES,
    resolveDashboardHero,
};