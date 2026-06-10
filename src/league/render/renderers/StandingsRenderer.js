const BaseRenderer = require('./BaseRenderer');
const { LAYOUT, computeCanvasHeight } = require('../constants/layout');
const { createRenderCanvas } = require('../core/CanvasFactory');
const { drawHeader, drawTable, paginateTable } = require('../drawing');
const { drawTextFit } = require('../drawing/drawTextFit');

const STANDINGS_COLUMN_LAYOUT = [
    { key: 'rank', width: 40, align: 'center' },
    { key: 'team', width: 400, align: 'left', type: 'team' },
    { key: 'played', width: 44, align: 'center' },
    { key: 'won', width: 44, align: 'center' },
    { key: 'drawn', width: 44, align: 'center' },
    { key: 'lost', width: 44, align: 'center' },
    { key: 'gf', width: 52, align: 'center' },
    { key: 'ga', width: 52, align: 'center' },
    { key: 'gd', width: 56, align: 'center' },
    { key: 'points', width: 88, align: 'center' }
];

/**
 * @param {ReturnType<import('../data/standingsView').buildStandingsView>['labels']} labels
 */
function buildStandingsColumns(labels) {
    return STANDINGS_COLUMN_LAYOUT.map((col) => ({
        ...col,
        label: labels.columns[col.key]
    }));
}

class StandingsRenderer extends BaseRenderer {
    /**
     * @param {ReturnType<import('../data/standingsView').buildStandingsView>} view
     */
    async render(view) {
        const labels = view.labels;
        const columns = buildStandingsColumns(labels);
        const pageInfo = paginateTable(view.rows, { page: view.page });
        const logos = await this.loadLogos(pageInfo.rows.map((row) => row.team));

        const contentWidth = LAYOUT.width - LAYOUT.padding * 2;
        const height = computeCanvasHeight({
            rowCount: pageInfo.rows.length || 1,
            extra: pageInfo.hasPagination ? 6 : 0
        });

        const { canvas, ctx, width } = createRenderCanvas(LAYOUT.width, height);
        await this.paintBackground(ctx, width, height, 'data');

        const x = LAYOUT.padding;
        let y = LAYOUT.padding;

        const badge = pageInfo.hasPagination
            ? labels.badgePage(pageInfo.page, pageInfo.totalPages)
            : labels.badgeTeams;

        drawHeader(ctx, {
            x,
            y,
            width: contentWidth,
            height: LAYOUT.headerHeight,
            title: view.league.name,
            subtitle: labels.subtitle,
            badge
        }, this.theme);

        y += LAYOUT.headerHeight + LAYOUT.headerGap;

        if (pageInfo.rows.length === 0) {
            drawTextFit(ctx, labels.empty, x + 12, y + 40, contentWidth - 24, {
                variant: 'body',
                color: this.theme.textSecondary,
                align: 'center'
            });
        } else {
            drawTable(ctx, {
                x,
                y,
                width: contentWidth,
                columns,
                rows: pageInfo.rows,
                logos
            }, this.theme);
        }

        if (pageInfo.hasPagination) {
            const footerY = height - LAYOUT.footerHeight;
            drawTextFit(ctx, labels.footerPage(pageInfo.page, pageInfo.totalPages), x, footerY, contentWidth, {
                variant: 'caption',
                color: this.theme.textMuted,
                align: 'center'
            });
        }

        this.drawWatermark(ctx, x, height - 10, contentWidth, 'Golazo');

        return {
            buffer: this.toBuffer(canvas),
            filename: `standings-${view.league.slug}-p${pageInfo.page}.png`,
            meta: pageInfo
        };
    }
}

module.exports = StandingsRenderer;