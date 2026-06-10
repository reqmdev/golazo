export declare const card: {
    readonly width: 1200;
    readonly padding: 20;
    readonly radius: 8;
    readonly headerHeight: 52;
    readonly headerGap: 10;
    readonly sectionGap: 10;
    readonly footerHeight: 28;
    readonly matchHeroHeight: 128;
    readonly maxStandingsRows: number;
    readonly maxFixtureRows: number;
    readonly maxTeamRows: number;
};
/** @deprecated Use `card` — kept for transitional imports */
export declare const portrait: {
    readonly width: 1200;
    readonly padding: 20;
    readonly radius: 8;
    readonly headerHeight: 52;
    readonly headerGap: 10;
    readonly sectionGap: 10;
    readonly footerHeight: 28;
    readonly matchHeroHeight: 128;
    readonly maxStandingsRows: number;
    readonly maxFixtureRows: number;
    readonly maxTeamRows: number;
};
export declare function matchCardHeight(): number;
export declare function standingsCardHeight(rowCount: number, hasPagination: boolean): number;
export declare function teamsCardHeight(rowCount: number, hasPagination: boolean): number;
export declare function fixtureCardHeight(rowCount: number, byeTeams: number, hasPagination: boolean): number;
//# sourceMappingURL=cardLayout.d.ts.map