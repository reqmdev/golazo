const { buildDashboardShell } = require('./design/shell');
const { DASHBOARD_VIEWS } = require('./constants');

/**
 * @param {object} input
 * @param {string} input.title
 * @param {string} [input.subtitle] — legacy; mapped to breadcrumb if breadcrumb omitted
 * @param {string} [input.breadcrumb]
 * @param {string} [input.body]
 * @param {string} [input.footer] — legacy role footer key
 * @param {string} [input.callout]
 * @param {'info' | 'warning' | 'danger'} [input.calloutTone]
 * @param {{ emoji?: string, label: string, value: string }[]} [input.stats]
 * @param {import('discord.js').ActionRowBuilder[]} [input.actionRows]
 * @param {number} [input.accentColor]
 * @param {string} [input.view]
 */
function buildDashboardPayload(input) {
    const {
        title,
        subtitle,
        breadcrumb,
        body,
        footer,
        callout,
        calloutTone,
        stats,
        actionRows = [],
        accentColor,
        view = DASHBOARD_VIEWS.HUB,
    } = input;

    if (!input.tr) {
        throw new Error('buildDashboardPayload requires tr');
    }

    return buildDashboardShell({
        view,
        tr: input.tr,
        title,
        subtitle,
        breadcrumb,
        stats,
        body,
        callout,
        calloutTone,
        footerRole: footer,
        accentColor,
        actionRows,
        includeHero: false,
    });
}

module.exports = {
    buildDashboardPayload,
};