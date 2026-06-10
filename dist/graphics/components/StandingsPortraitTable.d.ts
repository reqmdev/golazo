import type { Theme } from '../core/types';
export interface StandingsPortraitRow {
    rank?: number;
    team: {
        id: string;
        name: string;
        shortName?: string;
        color?: string;
    };
    played?: number;
    won?: number;
    drawn?: number;
    lost?: number;
    gd?: string | number;
    points?: number;
    form?: string[];
}
export declare function StandingsPortraitTable(props: {
    x: number;
    y: number;
    width: number;
    rows: StandingsPortraitRow[];
    logos: Map<string, Buffer | null>;
    theme: Theme;
}): import("../core/SvgBuilder").SvgNode;
//# sourceMappingURL=StandingsPortraitTable.d.ts.map