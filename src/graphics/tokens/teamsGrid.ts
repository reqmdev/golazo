import type { TeamListColumn } from '../components/TeamListTable';

/** Sums to 1128 — data width inside optical inset (1160 − 2×16). */
export const TEAMS_COLUMN_LAYOUT = [
  { key: 'team', width: 548, align: 'left' as const, type: 'team' as const },
  { key: 'captain', width: 250, align: 'center' as const },
  { key: 'role', width: 250, align: 'center' as const },
  { key: 'colors', width: 80, align: 'center' as const },
];

export function buildTeamsColumns(labels: {
  columns: Record<string, string>;
}): TeamListColumn[] {
  return TEAMS_COLUMN_LAYOUT.map((col) => ({
    ...col,
    label: labels.columns[col.key] ?? col.key,
  }));
}