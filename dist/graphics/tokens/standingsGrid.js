"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDINGS_COLUMN_LAYOUT = exports.STANDINGS_HEADER_ICON_SIZE = exports.STANDINGS_TABLE_METRICS = void 0;
exports.buildStandingsColumns = buildStandingsColumns;
exports.columnOffsets = columnOffsets;
/** Standings-only density — column widths stay fixed for optical symmetry. */
exports.STANDINGS_TABLE_METRICS = {
    rowHeight: 58,
    rowGap: 2,
    tableHeaderHeight: 42,
    headerIconSize: 14,
    logoSize: 48,
    logoGap: 12,
    formDotSize: 12,
    formGap: 4,
    teamNameClass: 'body',
};
/** Card header icon — slightly larger than default 22px chrome. */
exports.STANDINGS_HEADER_ICON_SIZE = 24;
/** Sums to 1128 — data width inside optical inset (1160 − 2×16). */
exports.STANDINGS_COLUMN_LAYOUT = [
    { key: 'rank', width: 44, align: 'center' },
    { key: 'team', width: 528, align: 'left', type: 'team' },
    { key: 'played', width: 48, align: 'center' },
    { key: 'won', width: 48, align: 'center' },
    { key: 'drawn', width: 48, align: 'center' },
    { key: 'lost', width: 48, align: 'center' },
    { key: 'gf', width: 56, align: 'center' },
    { key: 'ga', width: 56, align: 'center' },
    { key: 'gd', width: 60, align: 'center' },
    { key: 'points', width: 96, align: 'center' },
    { key: 'form', width: 96, align: 'center' },
];
function buildStandingsColumns(labels) {
    return exports.STANDINGS_COLUMN_LAYOUT.map((col) => ({
        ...col,
        label: labels.columns[col.key] ?? col.key,
    }));
}
function columnOffsets(columns, start = 14) {
    const map = new Map();
    let offset = start;
    for (const col of columns) {
        map.set(col.key, offset);
        offset += col.width;
    }
    return map;
}
//# sourceMappingURL=standingsGrid.js.map