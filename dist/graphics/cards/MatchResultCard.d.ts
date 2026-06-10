import type { RenderResult, Theme } from '../core/types';
export interface MatchResultView {
    league: {
        name: string;
        slug: string;
        season?: number;
    };
    home: {
        id: string;
        name: string;
        shortName?: string;
        logoUrl?: string | null;
        color?: string;
    };
    away: {
        id: string;
        name: string;
        shortName?: string;
        logoUrl?: string | null;
        color?: string;
    };
    match: {
        id: string;
        round: number;
        leg?: number;
        homeGoals?: number;
        awayGoals?: number;
        scoreText: string;
        resultLabel?: string;
        winner?: 'home' | 'away' | 'draw' | null;
    };
    labels: {
        subtitle: string;
    };
}
export declare function renderMatchResultCard(view: MatchResultView, theme: Theme, fetchLogo: (url: string) => Promise<Buffer | null>): Promise<RenderResult>;
//# sourceMappingURL=MatchResultCard.d.ts.map