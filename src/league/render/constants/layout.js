const { CANVAS_WIDTH, SPACING } = require('../../../canvas/tokens');
const { CARD_PAGE_SIZES } = require('../../constants/cardPageSize');

const LAYOUT = {
    width: CANVAS_WIDTH,
    padding: SPACING.padding,
    radius: 8,       // tighter pro flat
    radiusSm: 6,
    headerHeight: SPACING.headerHeight,
    headerGap: SPACING.headerGap,
    tableHeaderHeight: 48,
    tableHeaderGap: 4,
    rowHeight: 68,
    rowGap: 3,
    footerHeight: SPACING.footerHeight,
    logoSize: 40,
    logoSizeLg: 96,   // for hero results (Sofa scale)
    formDotSize: 12,
    formGap: 3,
    matchBlockHeight: 80,
    fixtureRowGap: 10,
    scoreLaneWidth: 110,
    // Match result hero (Sofa horizontal)
    matchHeroHeight: 260,
    scoreBoxWidth: 150,
    scoreBoxHeight: 78,
    // Logo + name groups in hero
    heroLogoSize: 96,
    // Max for safety
    maxCanvasHeight: 2400,
    maxRowsPerPage: CARD_PAGE_SIZES.standings,
    maxTeamRowsPerPage: CARD_PAGE_SIZES.teamList,
    maxFixtureRowsPerPage: CARD_PAGE_SIZES.fixture
};

/**
 * @param {{ headerHeight?: number, rowHeight?: number, rowCount: number, footerHeight?: number, rowGap?: number, extra?: number }} opts
 */
function computeCanvasHeight(opts) {
    const {
        headerHeight = LAYOUT.headerHeight,
        rowHeight = LAYOUT.rowHeight,
        rowCount,
        footerHeight = LAYOUT.footerHeight,
        rowGap = LAYOUT.rowGap,
        extra = 0
    } = opts;

    const tableBlock = LAYOUT.tableHeaderHeight
        + LAYOUT.tableHeaderGap
        + rowCount * rowHeight
        + Math.max(0, rowCount - 1) * rowGap;

    return Math.min(
        LAYOUT.maxCanvasHeight,
        LAYOUT.padding * 2
            + headerHeight
            + LAYOUT.headerGap
            + tableBlock
            + footerHeight
            + extra
    );
}

module.exports = {
    LAYOUT,
    computeCanvasHeight
};