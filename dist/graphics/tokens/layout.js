"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.layout = exports.MARK_SIZE = exports.HELP_FOOTER_HEIGHT = exports.CANVAS_WIDTH = void 0;
exports.computeCanvasHeight = computeCanvasHeight;
exports.computeMatchResultHeight = computeMatchResultHeight;
const path_1 = __importDefault(require("path"));
const spacing_1 = require("./spacing");
const radii_1 = require("./radii");
const { CARD_PAGE_SIZES } = require(path_1.default.join(__dirname, '../../../src/league/constants/cardPageSize'));
exports.CANVAS_WIDTH = 1200;
exports.HELP_FOOTER_HEIGHT = 120;
exports.MARK_SIZE = 128;
exports.layout = {
    width: exports.CANVAS_WIDTH,
    padding: spacing_1.spacing.padding,
    radius: radii_1.radius.card,
    radiusSm: radii_1.radius.chip,
    headerHeight: spacing_1.spacing.headerHeight,
    headerGap: spacing_1.spacing.headerGap,
    sectionGap: spacing_1.spacing.sectionGap,
    tableHeaderHeight: 36,
    tableHeaderGap: 2,
    rowHeight: 50,
    teamRowHeight: 56,
    rowGap: spacing_1.spacing.rowGap,
    footerHeight: spacing_1.spacing.footerHeight,
    logoSize: 40,
    logoSizeMd: 50,
    logoSizeLg: 72,
    formDotSize: 10,
    formGap: 4,
    matchBlockHeight: 66,
    fixtureRowGap: 4,
    scoreLaneWidth: 96,
    matchHeroHeight: 136,
    matchStatsHeight: 44,
    matchMomentumHeight: 30,
    scoreBoxWidth: 108,
    scoreBoxHeight: 72,
    heroLogoSize: 76,
    statPillHeight: 36,
    maxCanvasHeight: 2400,
    maxRowsPerPage: CARD_PAGE_SIZES.standings,
    maxFixtureRowsPerPage: CARD_PAGE_SIZES.fixture,
    maxTeamRowsPerPage: CARD_PAGE_SIZES.teamList,
};
function computeCanvasHeight(opts) {
    const { headerHeight = exports.layout.headerHeight, rowHeight = exports.layout.rowHeight, rowCount, footerHeight = exports.layout.footerHeight, rowGap = exports.layout.rowGap, tableHeaderHeight = exports.layout.tableHeaderHeight, extra = 0, tableWrap = exports.layout.sectionGap * 2, } = opts;
    const tableBlock = tableHeaderHeight +
        exports.layout.tableHeaderGap +
        rowCount * rowHeight +
        Math.max(0, rowCount - 1) * rowGap;
    return Math.min(exports.layout.maxCanvasHeight, exports.layout.padding * 2 +
        headerHeight +
        exports.layout.headerGap +
        tableWrap +
        tableBlock +
        footerHeight +
        extra);
}
function computeMatchResultHeight() {
    return (exports.layout.padding * 2 +
        exports.layout.headerHeight +
        exports.layout.headerGap +
        exports.layout.matchHeroHeight +
        exports.layout.sectionGap +
        exports.layout.matchStatsHeight +
        exports.layout.sectionGap +
        exports.layout.matchMomentumHeight +
        exports.layout.footerHeight);
}
//# sourceMappingURL=layout.js.map