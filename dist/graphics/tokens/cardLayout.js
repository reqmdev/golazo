"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portrait = exports.card = void 0;
exports.matchCardHeight = matchCardHeight;
exports.standingsCardHeight = standingsCardHeight;
exports.teamsCardHeight = teamsCardHeight;
exports.fixtureCardHeight = fixtureCardHeight;
/**
 * Unified 1200px sports card presets — match, standings, fixture share layout.ts.
 */
const layout_1 = require("./layout");
const standingsGrid_1 = require("./standingsGrid");
exports.card = {
    width: layout_1.layout.width,
    padding: layout_1.layout.padding,
    radius: layout_1.layout.radius,
    headerHeight: layout_1.layout.headerHeight,
    headerGap: layout_1.layout.headerGap,
    sectionGap: layout_1.layout.sectionGap,
    footerHeight: layout_1.layout.footerHeight,
    matchHeroHeight: 128,
    maxStandingsRows: layout_1.layout.maxRowsPerPage,
    maxFixtureRows: layout_1.layout.maxFixtureRowsPerPage,
    maxTeamRows: layout_1.layout.maxTeamRowsPerPage,
};
/** @deprecated Use `card` — kept for transitional imports */
exports.portrait = exports.card;
function matchCardHeight() {
    return (exports.card.padding * 2 +
        exports.card.headerHeight +
        exports.card.headerGap +
        exports.card.matchHeroHeight +
        exports.card.sectionGap +
        exports.card.footerHeight);
}
function standingsCardHeight(rowCount, hasPagination) {
    return (0, layout_1.computeCanvasHeight)({
        rowCount: Math.max(rowCount, 1),
        rowHeight: standingsGrid_1.STANDINGS_TABLE_METRICS.rowHeight,
        rowGap: standingsGrid_1.STANDINGS_TABLE_METRICS.rowGap,
        tableHeaderHeight: standingsGrid_1.STANDINGS_TABLE_METRICS.tableHeaderHeight,
        extra: hasPagination ? 6 : 0,
    });
}
function teamsCardHeight(rowCount, hasPagination) {
    return (0, layout_1.computeCanvasHeight)({
        rowHeight: layout_1.layout.teamRowHeight,
        rowCount: Math.max(rowCount, 1),
        extra: hasPagination ? 6 : 0,
    });
}
function fixtureCardHeight(rowCount, byeTeams, hasPagination) {
    const rows = Math.max(rowCount, 1);
    const listBlock = rows * layout_1.layout.matchBlockHeight + Math.max(0, rows - 1) * layout_1.layout.fixtureRowGap;
    return Math.min(layout_1.layout.maxCanvasHeight, exports.card.padding * 2 +
        exports.card.headerHeight +
        exports.card.headerGap +
        exports.card.sectionGap +
        listBlock +
        (byeTeams > 0 ? 32 : 0) +
        exports.card.footerHeight +
        (hasPagination ? 8 : 0));
}
//# sourceMappingURL=cardLayout.js.map