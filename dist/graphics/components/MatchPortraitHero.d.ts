import type { Theme } from '../core/types';
interface TeamSide {
    id: string;
    name: string;
    shortName?: string;
    color?: string | null;
}
/** Portrait match center — home top, score, away bottom. No boxed chrome. */
export declare function MatchPortraitHero(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    home: TeamSide;
    away: TeamSide;
    homeLogo?: Buffer | null;
    awayLogo?: Buffer | null;
    scoreText: string;
    homeGoals?: number;
    awayGoals?: number;
    statusLabel: string;
    winner?: 'home' | 'away' | 'draw' | null;
    theme: Theme;
}): import("../core/SvgBuilder").SvgNode;
export {};
//# sourceMappingURL=MatchPortraitHero.d.ts.map