import type { Theme } from '../core/types';
export interface TeamListColumn {
    key: string;
    label: string;
    width: number;
    align?: 'left' | 'center' | 'right';
    type?: 'team';
}
export declare function TeamListTable(props: {
    x: number;
    y: number;
    width: number;
    columns: TeamListColumn[];
    rows: Record<string, unknown>[];
    logos: Map<string, Buffer | null>;
    theme: Theme;
}): import("../core/SvgBuilder").SvgNode;
//# sourceMappingURL=TeamListTable.d.ts.map