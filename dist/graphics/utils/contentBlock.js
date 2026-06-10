"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixtureRowInset = exports.cardIconOpticalInset = exports.cardHeaderIcon = void 0;
exports.cardIconOpticalOffsetX = cardIconOpticalOffsetX;
exports.resolveContentBlock = resolveContentBlock;
exports.resolveCardContentArea = resolveCardContentArea;
exports.sumColumnWidths = sumColumnWidths;
/** Card header chrome — table/footer align with the header icon in the content block. */
exports.cardHeaderIcon = {
    size: 22,
    gap: 10,
    offsetY: 9,
    /** Stroke glyphs sit left-heavy in the 24×24 viewBox; nudge right for optical balance. */
    opticalOffsetX: 6,
};
/** Scale header optical offset for smaller inline icons (e.g. column headers). */
function cardIconOpticalOffsetX(iconSize) {
    return Math.round(exports.cardHeaderIcon.opticalOffsetX * (iconSize / exports.cardHeaderIcon.size));
}
/**
 * Symmetric inset so the header icon is not optically glued to the left edge.
 * Matches on both sides — icon mass no longer pulls the layout left.
 */
exports.cardIconOpticalInset = 16;
/** Extra horizontal inset for fixture rows inside the content block. */
exports.fixtureRowInset = 16;
/**
 * Horizontally center a fixed-width data block inside the card content area.
 */
function resolveContentBlock(containerWidth, blockWidth) {
    const width = Math.min(blockWidth, containerWidth);
    const inset = Math.max(0, (containerWidth - width) / 2);
    return { inset, width };
}
/**
 * Content origin for header, tables, and footer.
 * Data grids are sized to `containerWidth - 2×cardIconOpticalInset` so centering
 * leaves equal side margins and the header icon is not flush to the edge.
 */
function resolveCardContentArea(containerWidth, dataWidth) {
    const { inset } = resolveContentBlock(containerWidth, dataWidth);
    return {
        originX: inset,
        width: dataWidth,
    };
}
function sumColumnWidths(columns) {
    return columns.reduce((sum, column) => sum + column.width, 0);
}
//# sourceMappingURL=contentBlock.js.map