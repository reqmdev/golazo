import type { RenderResult, Theme } from '../core/types';
export interface TeamListRow {
    team: {
        id: string;
        name: string;
        shortName?: string;
        logoUrl?: string | null;
        color?: string;
        secondaryColor?: string;
    };
    captain: string;
    role: string;
}
export interface TeamsView {
    league: {
        name: string;
        slug: string;
        status?: string;
        season?: number;
    };
    rows: TeamListRow[];
    page: number;
    labels: {
        subtitle: string;
        empty: string;
        badgeTeams: string;
        badgePage: (page: number, total: number) => string;
        footerPage: (page: number, total: number) => string;
        columns: Record<string, string>;
    };
}
export declare function renderTeamsCard(view: TeamsView, theme: Theme, fetchLogo: (url: string) => Promise<Buffer | null>): Promise<RenderResult>;
//# sourceMappingURL=TeamsCard.d.ts.map