"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueTable = LeagueTable;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TeamRow_1 = require("./TeamRow");
const TeamForm_1 = require("./TeamForm");
const CardIcon_1 = require("./CardIcon");
const tableHeaderCell_1 = require("./tableHeaderCell");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const colors_1 = require("../utils/colors");
const surfaces_1 = require("../tokens/surfaces");
const tokens_1 = require("../tokens");
/** Only the team column repeats the card-level icon anchor on the left. */
const HEADER_ICONS = {
    team: 'teams',
};
const DEFAULT_METRICS = {
    rowHeight: tokens_1.layout.rowHeight,
    rowGap: tokens_1.layout.rowGap,
    tableHeaderHeight: tokens_1.layout.tableHeaderHeight,
    headerIconSize: 11,
    logoSize: tokens_1.layout.logoSize,
    logoGap: 10,
    formDotSize: tokens_1.layout.formDotSize,
    formGap: tokens_1.layout.formGap,
    teamNameClass: 'bodySm',
};
function columnsWidth(columns) {
    return columns.reduce((sum, column) => sum + column.width, 0);
}
function tableInset(width, columns) {
    return Math.max(0, (width - columnsWidth(columns)) / 2);
}
function tableHeader(columns, width, theme, metrics) {
    let offset = tableInset(width, columns);
    const items = [];
    for (const column of columns) {
        const iconKind = HEADER_ICONS[column.key];
        const cell = (0, tableHeaderCell_1.resolveHeaderCellLayout)(offset, column, iconKind, metrics.headerIconSize);
        if (iconKind) {
            items.push((0, CardIcon_1.CardIcon)({
                kind: iconKind,
                x: cell.iconX,
                y: metrics.tableHeaderHeight / 2 - cell.iconSize / 2,
                size: cell.iconSize,
                stroke: theme.textMuted,
                strokeWidth: 1.6,
            }));
        }
        items.push((0, SvgBuilder_1.h)('text', {
            x: cell.textX,
            y: metrics.tableHeaderHeight / 2,
            className: 'overline uppercase',
            fill: theme.textMuted,
            'text-anchor': cell.textAnchor,
            'dominant-baseline': 'middle',
            opacity: 0.75,
        }, column.label));
        offset += column.width;
    }
    return (0, SvgBuilder_1.h)('g', items);
}
function tableRow(block, theme) {
    const { width, y, height, columns, row, logos, metrics, isLast } = block;
    const rank = Number(row.rank ?? 0);
    const items = [];
    const rowMidY = y + height / 2;
    let offset = tableInset(width, columns);
    for (const column of columns) {
        if (column.type === 'team') {
            const team = row.team;
            items.push((0, TeamRow_1.TeamRow)({
                x: offset,
                y,
                width: column.width,
                height,
                team,
                logoBuffer: logos.get(team.id) ?? null,
                logoSize: metrics.logoSize,
                logoGap: metrics.logoGap,
                nameClass: metrics.teamNameClass,
                theme,
            }));
        }
        else if (column.key === 'rank') {
            const rankColor = (0, colors_1.resolveRankColor)(rank, theme);
            items.push((0, SvgBuilder_1.h)('text', {
                x: offset + column.width / 2,
                y: rowMidY,
                className: rank <= 3 ? 'stat tabular' : 'caption tabular',
                fill: rankColor,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
            }, (0, TextMeasurer_1.truncateText)('stat', String(rank), column.width - 4)));
        }
        else if (column.key === 'form') {
            const form = row.form;
            const dotSize = metrics.formDotSize;
            const gap = metrics.formGap;
            const formWidth = 5 * dotSize + 4 * gap;
            const formX = offset + (column.width - formWidth) / 2;
            items.push((0, TeamForm_1.TeamForm)({
                x: formX,
                centerY: rowMidY,
                form: form ?? [],
                theme,
                dotSize,
                gap,
            }));
        }
        else {
            const value = String(row[column.key] ?? '');
            const isPoints = column.key === 'points';
            const isGd = column.key === 'gd';
            let valueColor = isPoints ? theme.textPrimary : theme.textSecondary;
            if (isGd && value.startsWith('+'))
                valueColor = theme.accent;
            if (isGd && value.startsWith('-'))
                valueColor = theme.loss;
            const textX = column.align === 'center'
                ? offset + column.width / 2
                : column.align === 'right'
                    ? offset + column.width - 4
                    : offset;
            items.push((0, SvgBuilder_1.h)('text', {
                x: textX,
                y: rowMidY,
                className: 'stat tabular',
                fill: valueColor,
                'text-anchor': column.align === 'center' ? 'middle' : column.align === 'right' ? 'end' : 'start',
                'dominant-baseline': 'middle',
                opacity: isPoints ? 1 : 0.68,
            }, (0, TextMeasurer_1.truncateText)('stat', value, column.width - 8)));
        }
        offset += column.width;
    }
    if (!isLast) {
        const inset = tableInset(width, columns);
        items.push((0, SvgBuilder_1.h)('line', {
            x1: inset,
            y1: y + height,
            x2: width - inset,
            y2: y + height,
            stroke: surfaces_1.surfaces.strokeSubtle,
            'stroke-width': 1,
            opacity: 0.35,
        }));
    }
    return (0, SvgBuilder_1.h)('g', items);
}
function LeagueTable(props) {
    const { width, columns, rows, logos, theme } = props;
    const metrics = props.metrics ?? DEFAULT_METRICS;
    const rowHeight = metrics.rowHeight;
    const inner = [tableHeader(columns, width, theme, metrics)];
    let rowY = metrics.tableHeaderHeight + tokens_1.layout.tableHeaderGap;
    rows.forEach((row, index) => {
        inner.push(tableRow({
            width,
            y: rowY,
            height: rowHeight,
            columns,
            row,
            logos,
            metrics,
            isLast: index === rows.length - 1,
        }, theme));
        rowY += rowHeight + metrics.rowGap;
    });
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, ...inner);
}
//# sourceMappingURL=LeagueTable.js.map