declare class FontRegistryImpl {
    private fontFiles;
    private projectRoot;
    getFontFiles(): string[];
    getResvgFontOptions(): {
        fontFiles: string[];
        loadSystemFonts: boolean;
        defaultFontFamily: string;
        sansSerifFamily: string;
        monospaceFamily: string;
    };
    buildFontFaceCss(): string;
}
export declare function getFontRegistry(): FontRegistryImpl;
export {};
//# sourceMappingURL=FontRegistry.d.ts.map