import type { Theme } from '../core/types';
export declare function ScoreDisplay(props: {
    x: number;
    y: number;
    homeGoals: number;
    awayGoals: number;
    statusLabel?: string;
    winner?: 'home' | 'away' | 'draw' | null;
    theme: Theme;
    upcoming?: boolean;
}): import("../core/SvgBuilder").SvgNode;
//# sourceMappingURL=ScoreDisplay.d.ts.map