import type { Theme } from '../core/types';
interface TeamSide {
    id: string;
    name: string;
    shortName?: string;
    color?: string | null;
}
export declare function MatchHeroRow(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    home: TeamSide;
    away: TeamSide;
    homeLogo?: Buffer | null;
    awayLogo?: Buffer | null;
    homeGoals: number;
    awayGoals: number;
    statusLabel: string;
    winner?: 'home' | 'away' | 'draw' | null;
    theme: Theme;
}): import("../core/SvgBuilder").SvgNode;
export {};
//# sourceMappingURL=MatchHeroRow.d.ts.map