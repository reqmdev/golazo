/**
 * Unified 1200px sports card presets — match, standings, fixture share layout.ts.
 */
import { layout, computeCanvasHeight } from './layout';
import { STANDINGS_TABLE_METRICS } from './standingsGrid';

export const card = {
  width: layout.width,
  padding: layout.padding,
  radius: layout.radius,
  headerHeight: layout.headerHeight,
  headerGap: layout.headerGap,
  sectionGap: layout.sectionGap,
  footerHeight: layout.footerHeight,
  matchHeroHeight: 128,
  maxStandingsRows: layout.maxRowsPerPage,
  maxFixtureRows: layout.maxFixtureRowsPerPage,
  maxTeamRows: layout.maxTeamRowsPerPage,
} as const;

/** @deprecated Use `card` — kept for transitional imports */
export const portrait = card;

export function matchCardHeight(): number {
  return (
    card.padding * 2 +
    card.headerHeight +
    card.headerGap +
    card.matchHeroHeight +
    card.sectionGap +
    card.footerHeight
  );
}

export function standingsCardHeight(rowCount: number, hasPagination: boolean): number {
  return computeCanvasHeight({
    rowCount: Math.max(rowCount, 1),
    rowHeight: STANDINGS_TABLE_METRICS.rowHeight,
    rowGap: STANDINGS_TABLE_METRICS.rowGap,
    tableHeaderHeight: STANDINGS_TABLE_METRICS.tableHeaderHeight,
    extra: hasPagination ? 6 : 0,
  });
}

export function teamsCardHeight(rowCount: number, hasPagination: boolean): number {
  return computeCanvasHeight({
    rowHeight: layout.teamRowHeight,
    rowCount: Math.max(rowCount, 1),
    extra: hasPagination ? 6 : 0,
  });
}

export function fixtureCardHeight(rowCount: number, byeTeams: number, hasPagination: boolean): number {
  const rows = Math.max(rowCount, 1);
  const listBlock = rows * layout.matchBlockHeight + Math.max(0, rows - 1) * layout.fixtureRowGap;

  return Math.min(
    layout.maxCanvasHeight,
    card.padding * 2 +
      card.headerHeight +
      card.headerGap +
      card.sectionGap +
      listBlock +
      (byeTeams > 0 ? 32 : 0) +
      card.footerHeight +
      (hasPagination ? 8 : 0),
  );
}