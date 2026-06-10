"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamListTable = TeamListTable;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TeamRow_1 = require("./TeamRow");
const CardIcon_1 = require("./CardIcon");
const tableHeaderCell_1 = require("./tableHeaderCell");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const tokens_1 = require("../tokens");
const HEADER_ICONS = {
    team: 'teams',
    captain: 'captain',
    role: 'role',
    colors: 'colors',
};
function columnsWidth(columns) {
    return columns.reduce((sum, column) => sum + column.width, 0);
}
function tableInset(width, columns) {
    return Math.max(0, (width - columnsWidth(columns)) / 2);
}
function colorSwatches(primary, secondary, x, y, columnWidth) {
    const size = 14;
    const gap = 6;
    const blockWidth = size * 2 + gap;
    const startX = x + (columnWidth - blockWidth) / 2;
    const cy = y;
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('rect', {
        x: startX,
        y: cy - size / 2,
        width: size,
        height: size,
        rx: 3,
        fill: primary || '#2a2f38',
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.95,
    }), (0, SvgBuilder_1.h)('rect', {
        x: startX + size + gap,
        y: cy - size / 2,
        width: size,
        height: size,
        rx: 3,
        fill: secondary || '#ffffff',
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.95,
    }));
}
function tableHeader(columns, width, theme) {
    let offset = tableInset(width, columns);
    const items = [];
    for (const column of columns) {
        const iconKind = HEADER_ICONS[column.key];
        const cell = (0, tableHeaderCell_1.resolveHeaderCellLayout)(offset, column, iconKind);
        if (iconKind) {
            items.push((0, CardIcon_1.CardIcon)({
                kind: iconKind,
                x: cell.iconX,
                y: tokens_1.layout.tableHeaderHeight / 2 - cell.iconSize / 2,
                size: cell.iconSize,
                stroke: theme.textMuted,
                strokeWidth: 1.6,
            }));
        }
        items.push((0, SvgBuilder_1.h)('text', {
            x: cell.textX,
            y: tokens_1.layout.tableHeaderHeight / 2,
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
    const { width, y, height, columns, row, logos, index, isLast } = block;
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
                theme,
            }));
        }
        else if (column.key === 'colors') {
            const team = row.team;
            items.push(colorSwatches(team.color, team.secondaryColor, offset, rowMidY, column.width));
        }
        else {
            const value = String(row[column.key] ?? '');
            const textX = column.align === 'center'
                ? offset + column.width / 2
                : column.align === 'right'
                    ? offset + column.width - 4
                    : offset + 4;
            items.push((0, SvgBuilder_1.h)('text', {
                x: textX,
                y: rowMidY,
                className: 'bodySm',
                fill: value === '—' || value === '-' ? theme.textMuted : theme.textSecondary,
                'text-anchor': column.align === 'center' ? 'middle' : column.align === 'right' ? 'end' : 'start',
                'dominant-baseline': 'middle',
                opacity: value === '—' || value === '-' ? 0.55 : 0.88,
            }, (0, TextMeasurer_1.truncateText)('bodySm', value, column.width - 10)));
        }
        offset += column.width;
    }
    if (!isLast) {
        items.push((0, SvgBuilder_1.h)('line', {
            x1: tableInset(width, columns),
            y1: y + height,
            x2: width - tableInset(width, columns),
            y2: y + height,
            stroke: surfaces_1.surfaces.strokeSubtle,
            'stroke-width': 1,
            opacity: 0.35,
        }));
    }
    return (0, SvgBuilder_1.h)('g', items);
}
function TeamListTable(props) {
    const { width, columns, rows, logos, theme } = props;
    const rowHeight = tokens_1.layout.teamRowHeight;
    const inner = [tableHeader(columns, width, theme)];
    let rowY = tokens_1.layout.tableHeaderHeight + tokens_1.layout.tableHeaderGap;
    rows.forEach((row, index) => {
        inner.push(tableRow({
            width,
            y: rowY,
            height: rowHeight,
            columns,
            row,
            logos,
            index,
            isLast: index === rows.length - 1,
        }, theme));
        rowY += rowHeight + tokens_1.layout.rowGap;
    });
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, ...inner);
}
//# sourceMappingURL=TeamListTable.js.map