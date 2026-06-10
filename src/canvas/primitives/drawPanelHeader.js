const { drawTextFit } = require("../../league/render/drawing/drawTextFit");
const { drawChip } = require("./drawPill");
const { paintCard } = require("./paintSurface");

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, width: number, height: number, title: string, subtitle?: string, badge?: string }} block
 * @param {object} theme
 */
function drawPanelHeader(ctx, block, theme) {
  const { x, y, width, height, title, subtitle, badge } = block;

  // Flat pro card (SofaScore) — paintCard is now hairline + flat
  paintCard(ctx, x, y, width, height, theme.surfaceRaised);

  const centerX = x + width / 2;

  // Restrained header (lower weight than before; matches Sofa data apps)
  drawTextFit(ctx, title, centerX, y + 38, width - 60, {
    variant: "title",
    color: theme.accent,
    align: "center",
    baseline: "middle",
  });

  if (subtitle) {
    drawTextFit(ctx, subtitle, centerX, y + 64, width - 60, {
      variant: "subtitle",
      color: theme.textSecondary,
      align: "center",
      baseline: "middle",
    });
  }

  // Restrained badge chip (sentence/minimal case preferred)
  if (badge) {
    drawChip(
      ctx,
      {
        x: x + width - 24,
        y: y + height / 2,
        label: badge,
        maxWidth: 220,
        fill: theme.accentSoft || "rgba(255, 255, 255, 0.04)",
        textColor: theme.textMuted,
        height: 24,
        radius: 5,
      },
      theme,
    );
  }
}

module.exports = { drawPanelHeader };
