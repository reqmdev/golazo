const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const LeagueService = require('../../league/services/LeagueService');
const AuditService = require('../../league/services/AuditService');
const { buildDashboardShell } = require('../design/shell');
const { buildPanelChrome } = require('../design/context');
const { buildTable } = require('../design/table');
const { buildSectionTitle } = require('../design/typography');
const { buildDashboardBackRow } = require('../panelBackNav');
const { buildViewerContext } = require('../permissions');
const { encodeDashboardId } = require('../ids');
const { DASHBOARD_VIEWS, ADMIN_ACTIONS } = require('../constants');
const { clipV2Text } = require('../../ui/ComponentsV2Factory');

/**
 * @param {object[]} entries
 * @param {(key: string, params?: object) => string} tr
 * @param {string} leagueName
 */
function buildAuditTable(entries, tr, leagueName, budget) {
    const emDash = tr('common.emDash');
    const columns = [
        { header: tr('dashboard.design.table.when'), maxWidth: 12 },
        { header: tr('dashboard.design.table.action'), maxWidth: 18 },
        { header: tr('dashboard.design.table.actor'), maxWidth: 20 },
        { header: tr('dashboard.design.table.summary'), maxWidth: 28 },
    ];

    const rows = entries.length
        ? entries.map((entry) => {
            const when = entry.createdAt
                ? `<t:${Math.floor(new Date(entry.createdAt).getTime() / 1000)}:R>`
                : emDash;

            return [
                when,
                entry.action,
                `<@${entry.actorId}>`,
                entry.summary || emDash,
            ];
        })
        : [[emDash, emDash, emDash, tr('format.audit.empty')]];

    const table = buildTable(columns, rows);
    const heading = buildSectionTitle(
        tr('handlers.audit.title', { name: leagueName, count: entries.length }),
        budget,
        ['📋', { key: 'page' }],
    );

    return clipV2Text([heading, table].filter(Boolean).join('\n'));
}

/**
 * @param {object} input
 */
async function buildAdminPanelPayload(input) {
    const { guildId, slug, member, userId, tr, guild, confirmReset = false } = input;
    const league = await LeagueService.resolveLeague(guildId, slug);
    const viewer = buildViewerContext({ member, userId, league });

    if (!viewer.canManage) {
        return buildDashboardShell({
            ...buildPanelChrome({
                view: DASHBOARD_VIEWS.ADMIN,
                tr,
                slug,
                guildName: guild?.name,
                league,
                hint: tr('dashboard.errors.adminOnly'),
                hintTone: 'warning',
            }),
            externalActionRows: [buildDashboardBackRow(tr, slug)],
        });
    }

    const entries = await AuditService.listForLeague(league._id, { limit: 10 });

    const actionRows = [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.ADMIN, ADMIN_ACTIONS.REFRESH, slug))
                .setLabel(tr('dashboard.admin.refresh'))
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.ADMIN, ADMIN_ACTIONS.ROLLBACK, slug))
                .setLabel(tr('dashboard.admin.rollback'))
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📊'),
        ),
    ];

    let hint;
    let hintTone = 'info';

    if (confirmReset) {
        hint = tr('dashboard.design.callout.resetConfirm');
        hintTone = 'danger';
        actionRows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.ADMIN, ADMIN_ACTIONS.RESET_CONFIRM, slug))
                    .setLabel(tr('dashboard.admin.resetConfirm'))
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚠️'),
                new ButtonBuilder()
                    .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.ADMIN, ADMIN_ACTIONS.REFRESH, slug))
                    .setLabel(tr('dashboard.admin.resetCancel'))
                    .setStyle(ButtonStyle.Secondary),
            ),
        );
    } else {
        actionRows[0].addComponents(
            new ButtonBuilder()
                .setCustomId(encodeDashboardId(DASHBOARD_VIEWS.ADMIN, ADMIN_ACTIONS.RESET, slug))
                .setLabel(tr('dashboard.admin.reset'))
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
        );
    }

    return buildDashboardShell({
        ...buildPanelChrome({
            view: DASHBOARD_VIEWS.ADMIN,
            tr,
            slug,
            guildName: guild?.name,
            league,
            footerRole: viewer.roleKey,
            hint,
            hintTone,
        }),
        bodyBuilder: (budget) => buildAuditTable(entries, tr, league.name, budget),
        actionRows,
        externalActionRows: [buildDashboardBackRow(tr, slug)],
    });
}

module.exports = {
    buildAdminPanelPayload,
    buildAuditTable,
};