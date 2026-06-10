/** Card header chrome — table/footer align with the header icon in the content block. */
export declare const cardHeaderIcon: {
    readonly size: 22;
    readonly gap: 10;
    readonly offsetY: 9;
    /** Stroke glyphs sit left-heavy in the 24×24 viewBox; nudge right for optical balance. */
    readonly opticalOffsetX: 6;
};
/** Scale header optical offset for smaller inline icons (e.g. column headers). */
export declare function cardIconOpticalOffsetX(iconSize: number): number;
/**
 * Symmetric inset so the header icon is not optically glued to the left edge.
 * Matches on both sides — icon mass no longer pulls the layout left.
 */
export declare const cardIconOpticalInset = 16;
/** Extra horizontal inset for fixture rows inside the content block. */
export declare const fixtureRowInset = 16;
/**
 * Horizontally center a fixed-width data block inside the card content area.
 */
export declare function resolveContentBlock(containerWidth: number, blockWidth: number): {
    inset: number;
    width: number;
};
/**
 * Content origin for header, tables, and footer.
 * Data grids are sized to `containerWidth - 2×cardIconOpticalInset` so centering
 * leaves equal side margins and the header icon is not flush to the edge.
 */
export declare function resolveCardContentArea(containerWidth: number, dataWidth: number): {
    originX: number;
    width: number;
};
export declare function sumColumnWidths(columns: {
    width: number;
}[]): number;
//# sourceMappingURL=contentBlock.d.ts.map