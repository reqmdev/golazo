import type { TableColumn } from '../components/LeagueTable';
import type { TableMetrics } from '../components/LeagueTable';

/** Standings-only density — column widths stay fixed for optical symmetry. */
export const STANDINGS_TABLE_METRICS: TableMetrics = {
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
export const STANDINGS_HEADER_ICON_SIZE = 24;

/** Sums to 1128 — data width inside optical inset (1160 − 2×16). */
export const STANDINGS_COLUMN_LAYOUT = [
  { key: 'rank', width: 44, align: 'center' as const },
  { key: 'team', width: 528, align: 'left' as const, type: 'team' as const },
  { key: 'played', width: 48, align: 'center' as const },
  { key: 'won', width: 48, align: 'center' as const },
  { key: 'drawn', width: 48, align: 'center' as const },
  { key: 'lost', width: 48, align: 'center' as const },
  { key: 'gf', width: 56, align: 'center' as const },
  { key: 'ga', width: 56, align: 'center' as const },
  { key: 'gd', width: 60, align: 'center' as const },
  { key: 'points', width: 96, align: 'center' as const },
  { key: 'form', width: 96, align: 'center' as const },
];

export function buildStandingsColumns(labels: {
  columns: Record<string, string>;
}): TableColumn[] {
  return STANDINGS_COLUMN_LAYOUT.map((col) => ({
    ...col,
    label: labels.columns[col.key] ?? col.key,
  }));
}

export function columnOffsets(columns: TableColumn[], start = 14): Map<string, number> {
  const map = new Map<string, number>();
  let offset = start;
  for (const col of columns) {
    map.set(col.key, offset);
    offset += col.width;
  }
  return map;
}