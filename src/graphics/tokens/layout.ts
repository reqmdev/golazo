import path from 'path';
import { spacing } from './spacing';
import { radius } from './radii';

const { CARD_PAGE_SIZES } = require(path.join(
  __dirname,
  '../../../src/league/constants/cardPageSize',
)) as {
  CARD_PAGE_SIZES: { standings: number; teamList: number; fixture: number };
};

export const CANVAS_WIDTH = 1200;
export const HELP_FOOTER_HEIGHT = 120;
export const MARK_SIZE = 128;

export const layout = {
  width: CANVAS_WIDTH,
  padding: spacing.padding,
  radius: radius.card,
  radiusSm: radius.chip,
  headerHeight: spacing.headerHeight,
  headerGap: spacing.headerGap,
  sectionGap: spacing.sectionGap,
  tableHeaderHeight: 36,
  tableHeaderGap: 2,
  rowHeight: 50,
  teamRowHeight: 56,
  rowGap: spacing.rowGap,
  footerHeight: spacing.footerHeight,
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
} as const;

export function computeCanvasHeight(opts: {
  headerHeight?: number;
  rowHeight?: number;
  rowCount: number;
  footerHeight?: number;
  rowGap?: number;
  tableHeaderHeight?: number;
  extra?: number;
  tableWrap?: number;
}): number {
  const {
    headerHeight = layout.headerHeight,
    rowHeight = layout.rowHeight,
    rowCount,
    footerHeight = layout.footerHeight,
    rowGap = layout.rowGap,
    tableHeaderHeight = layout.tableHeaderHeight,
    extra = 0,
    tableWrap = layout.sectionGap * 2,
  } = opts;

  const tableBlock =
    tableHeaderHeight +
    layout.tableHeaderGap +
    rowCount * rowHeight +
    Math.max(0, rowCount - 1) * rowGap;

  return Math.min(
    layout.maxCanvasHeight,
    layout.padding * 2 +
      headerHeight +
      layout.headerGap +
      tableWrap +
      tableBlock +
      footerHeight +
      extra,
  );
}

export function computeMatchResultHeight(): number {
  return (
    layout.padding * 2 +
    layout.headerHeight +
    layout.headerGap +
    layout.matchHeroHeight +
    layout.sectionGap +
    layout.matchStatsHeight +
    layout.sectionGap +
    layout.matchMomentumHeight +
    layout.footerHeight
  );
}