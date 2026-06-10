export declare function getCanvasAssetsRoot(): string;
export declare function getAssetBuffer(relativePath: string): Promise<Buffer | null>;
export declare function getLogoBuffer(url: string | null | undefined, fetcher: (url: string) => Promise<Buffer | null>, ttlMs?: number): Promise<Buffer | null>;
export declare function loadTeamLogos(teams: Array<{
    id: string;
    logoUrl?: string | null;
}>, fetcher: (url: string) => Promise<Buffer | null>): Promise<Map<string, Buffer | null>>;
export declare function clearAssetCache(): void;
//# sourceMappingURL=AssetCache.d.ts.map