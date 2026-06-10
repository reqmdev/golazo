import type { TypeVariant } from '../typography/styles';
import type { Theme } from '../core/types';
export interface TableColumn {
    key: string;
    label: string;
    width: number;
    align?: 'left' | 'center' | 'right';
    type?: 'text' | 'team';
}
export interface TableMetrics {
    rowHeight: number;
    rowGap: number;
    tableHeaderHeight: number;
    headerIconSize: number;
    logoSize: number;
    logoGap: number;
    formDotSize: number;
    formGap: number;
    teamNameClass: TypeVariant;
}
export declare function LeagueTable(props: {
    x: number;
    y: number;
    width: number;
    columns: TableColumn[];
    rows: Record<string, unknown>[];
    logos: Map<string, Buffer | null>;
    metrics?: TableMetrics;
    theme: Theme;
}): import("../core/SvgBuilder").SvgNode;
//# sourceMappingURL=LeagueTable.d.ts.map