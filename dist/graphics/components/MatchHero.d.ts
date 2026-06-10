import type { Theme } from '../core/types';
interface TeamSide {
    id: string;
    name: string;
    shortName?: string;
    color?: string;
}
export declare function MatchHero(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    home: TeamSide;
    away: TeamSide;
    homeLogo?: Buffer | null;
    awayLogo?: Buffer | null;
    scoreText: string;
    statusLabel: string;
    winner?: 'home' | 'away' | 'draw' | null;
    theme: Theme;
}): import("../core/SvgBuilder").SvgNode;
export {};
//# sourceMappingURL=MatchHero.d.ts.map