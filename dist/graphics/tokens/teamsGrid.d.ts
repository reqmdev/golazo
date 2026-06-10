import type { TeamListColumn } from '../components/TeamListTable';
/** Sums to 1128 — data width inside optical inset (1160 − 2×16). */
export declare const TEAMS_COLUMN_LAYOUT: ({
    key: string;
    width: number;
    align: "left";
    type: "team";
} | {
    key: string;
    width: number;
    align: "center";
    type?: undefined;
})[];
export declare function buildTeamsColumns(labels: {
    columns: Record<string, string>;
}): TeamListColumn[];
//# sourceMappingURL=teamsGrid.d.ts.map