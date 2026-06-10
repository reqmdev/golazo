import type { TableColumn } from '../components/LeagueTable';
import type { TableMetrics } from '../components/LeagueTable';
/** Standings-only density — column widths stay fixed for optical symmetry. */
export declare const STANDINGS_TABLE_METRICS: TableMetrics;
/** Card header icon — slightly larger than default 22px chrome. */
export declare const STANDINGS_HEADER_ICON_SIZE = 24;
/** Sums to 1128 — data width inside optical inset (1160 − 2×16). */
export declare const STANDINGS_COLUMN_LAYOUT: ({
    key: string;
    width: number;
    align: "center";
    type?: undefined;
} | {
    key: string;
    width: number;
    align: "left";
    type: "team";
})[];
export declare function buildStandingsColumns(labels: {
    columns: Record<string, string>;
}): TableColumn[];
export declare function columnOffsets(columns: TableColumn[], start?: number): Map<string, number>;
//# sourceMappingURL=standingsGrid.d.ts.map