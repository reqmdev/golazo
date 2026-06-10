import type { RenderResult, Theme } from '../core/types';
export interface FixtureRow {
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
    scoreText: string;
    isPlayed?: boolean;
    leg?: number;
    round?: number;
}
export interface FixtureView {
    league: {
        name: string;
        slug: string;
        totalRounds?: number;
        season?: number;
    };
    round: number;
    rows: FixtureRow[];
    page?: number;
    byeTeams?: string[];
    labels: {
        subtitle: string;
        empty: string;
        badgePage: (page: number, total: number) => string;
        badgeMatches: string;
        footerPage: (page: number, total: number) => string;
        bye: (teams: string) => string;
        leg?: (leg: number) => string;
        played?: string;
        upcoming?: string;
    };
}
export declare function renderFixtureCard(view: FixtureView, theme: Theme, fetchLogo: (url: string) => Promise<Buffer | null>): Promise<RenderResult>;
//# sourceMappingURL=FixtureCard.d.ts.map