const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder } = require('discord.js');
const { encodeDashboardId } = require('./ids');
const { DASHBOARD_VIEWS, LEAGUE_ACTIONS } = require('./constants');

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 * @param {string} slug
 */
function buildDashboardBackRow(tr, slug) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.LEAGUE, LEAGUE_ACTIONS.BACK, slug))
            .setLabel(tr('dashboard.league.backToLeague'))
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏆'),
        new ButtonBuilder()
            .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.LEAGUE, LEAGUE_ACTIONS.BACK))
            .setLabel(tr('dashboard.league.back'))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏠'),
    );
}

/**
 * @param {import('discord.js').InteractionReplyOptions} payload
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 * @param {string} slug
 * @param {import('discord.js').ActionRowBuilder[]} [prependRows]
 */
function appendDashboardBackNav(payload, tr, slug, prependRows = []) {
    const backRow = buildDashboardBackRow(tr, slug);
    const trailingRows = [backRow, ...prependRows].filter(Boolean);
    const components = payload.components || [];

    if (!trailingRows.length || !components.length) {
        return payload;
    }

    const main = components[0];

    if (!(main instanceof ContainerBuilder)) {
        return payload;
    }

    for (const row of trailingRows) {
        main.addActionRowComponents(row);
    }

    return payload;
}

/**
 * @param {string} ref
 */
function parsePanelRef(ref) {
    const parts = ref.split('|');
    return {
        slug: parts[0] || '',
        extras: parts.slice(1),
    };
}

/**
 * @param {string} slug
 * @param {...string} extras
 */
function encodePanelRef(slug, ...extras) {
    return [slug, ...extras].join('|');
}

module.exports = {
    buildDashboardBackRow,
    appendDashboardBackNav,
    parsePanelRef,
    encodePanelRef,
};