/** Card header chrome — table/footer align with the header icon in the content block. */
export const cardHeaderIcon = {
  size: 22,
  gap: 10,
  offsetY: 9,
  /** Stroke glyphs sit left-heavy in the 24×24 viewBox; nudge right for optical balance. */
  opticalOffsetX: 6,
} as const;

/** Scale header optical offset for smaller inline icons (e.g. column headers). */
export function cardIconOpticalOffsetX(iconSize: number): number {
  return Math.round(cardHeaderIcon.opticalOffsetX * (iconSize / cardHeaderIcon.size));
}

/**
 * Symmetric inset so the header icon is not optically glued to the left edge.
 * Matches on both sides — icon mass no longer pulls the layout left.
 */
export const cardIconOpticalInset = 16;

/** Extra horizontal inset for fixture rows inside the content block. */
export const fixtureRowInset = 16;

/**
 * Horizontally center a fixed-width data block inside the card content area.
 */
export function resolveContentBlock(
  containerWidth: number,
  blockWidth: number,
): { inset: number; width: number } {
  const width = Math.min(blockWidth, containerWidth);
  const inset = Math.max(0, (containerWidth - width) / 2);

  return { inset, width };
}

/**
 * Content origin for header, tables, and footer.
 * Data grids are sized to `containerWidth - 2×cardIconOpticalInset` so centering
 * leaves equal side margins and the header icon is not flush to the edge.
 */
export function resolveCardContentArea(
  containerWidth: number,
  dataWidth: number,
): { originX: number; width: number } {
  const { inset } = resolveContentBlock(containerWidth, dataWidth);

  return {
    originX: inset,
    width: dataWidth,
  };
}

export function sumColumnWidths(columns: { width: number }[]): number {
  return columns.reduce((sum, column) => sum + column.width, 0);
}