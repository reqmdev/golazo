"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEAMS_COLUMN_LAYOUT = void 0;
exports.buildTeamsColumns = buildTeamsColumns;
/** Sums to 1128 — data width inside optical inset (1160 − 2×16). */
exports.TEAMS_COLUMN_LAYOUT = [
    { key: 'team', width: 548, align: 'left', type: 'team' },
    { key: 'captain', width: 250, align: 'center' },
    { key: 'role', width: 250, align: 'center' },
    { key: 'colors', width: 80, align: 'center' },
];
function buildTeamsColumns(labels) {
    return exports.TEAMS_COLUMN_LAYOUT.map((col) => ({
        ...col,
        label: labels.columns[col.key] ?? col.key,
    }));
}
//# sourceMappingURL=teamsGrid.js.map