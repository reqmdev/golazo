import type { Theme } from '../core/types';
export declare function FixtureListRow(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    row: {
        home: {
            id: string;
            name: string;
            shortName?: string;
            color?: string;
        };
        away: {
            id: string;
            name: string;
            shortName?: string;
            color?: string;
        };
        scoreText: string;
        isPlayed?: boolean;
        leg?: number;
    };
    logos: Map<string, Buffer | null>;
    index: number;
    theme: Theme;
    legLabel?: (leg: number) => string;
    playedLabel?: string;
    upcomingLabel?: string;
    isLast?: boolean;
}): import("../core/SvgBuilder").SvgNode;
//# sourceMappingURL=FixtureListRow.d.ts.map