import type { RenderResult, Theme } from '../core/types';
export interface StandingsRow {
    team: {
        id: string;
        name: string;
        logoUrl?: string | null;
        color?: string;
        displayName?: string;
        shortName?: string;
    };
    form?: string[];
    rank?: number;
    played?: number;
    won?: number;
    drawn?: number;
    lost?: number;
    gf?: number;
    ga?: number;
    gd?: string | number;
    points?: number;
    [key: string]: unknown;
}
export interface StandingsView {
    league: {
        name: string;
        slug: string;
        season?: number;
    };
    rows: StandingsRow[];
    page: number;
    labels: {
        subtitle: string;
        empty: string;
        badgePage: (page: number, total: number) => string;
        badgeTeams: string;
        footerPage: (page: number, total: number) => string;
        columns: Record<string, string>;
    };
}
export declare function renderStandingsCard(view: StandingsView, theme: Theme, fetchLogo: (url: string) => Promise<Buffer | null>): Promise<RenderResult>;
//# sourceMappingURL=StandingsCard.d.ts.map