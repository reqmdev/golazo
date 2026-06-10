const { PALETTE, SURFACE, RADII, PRO } = require("../tokens");
const {
  fillRoundRect,
  strokeRoundRect,
} = require("../../league/render/utils/geometry");

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {object} [options]
 * @param {import('@napi-rs/canvas').Image | null} [options.cover]
 * @param {number} [options.coverOpacity]
 */
function paintSurface(ctx, width, height, options = {}) {
  ctx.fillStyle = SURFACE.canvas;
  ctx.fillRect(0, 0, width, height);

  if (options.cover) {
    ctx.save();
    // Lower opacity for cleaner SofaScore data focus (was 0.22-0.24)
    ctx.globalAlpha = options.coverOpacity ?? 0.10;
    ctx.drawImage(options.cover, 0, 0, width, height);
    ctx.restore();

    const wash = ctx.createLinearGradient(0, 0, 0, height);
    wash.addColorStop(0, "rgba(8,9,10,0.72)");
    wash.addColorStop(0.55, "rgba(8,9,10,0.88)");
    wash.addColorStop(1, SURFACE.canvas);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Flat dark — no heavy ambient gradient
    ctx.fillStyle = SURFACE.canvas;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Pro flat card (SofaScore enterprise style).
 * No shadows, no noise, no glass, no decorative gradients.
 * Hairline border + subtle surface only. All measurements from tokens.
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {string} [fill]
 */
function paintCard(ctx, x, y, width, height, fill) {
  const surface = fill || SURFACE.proCard || SURFACE.surfaceRaised;
  fillRoundRect(ctx, x, y, width, height, RADII.card, surface);

  // Single hairline border (1px) — the only decoration allowed
  strokeRoundRect(
    ctx,
    x + 0.5,
    y + 0.5,
    width - 1,
    height - 1,
    RADII.card,
    SURFACE.proBorder || SURFACE.borderSubtle,
    1,
  );
}

/**
 * Minimal outer frame (hairline only). Can be removed entirely for cleaner Sofa look.
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
function paintGameFrame(ctx, width, height) {
  strokeRoundRect(
    ctx,
    10,
    10,
    width - 20,
    height - 20,
    RADII.panel,
    SURFACE.hairline || "rgba(255,255,255,0.04)",
    1,
  );
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {string} accent
 * @param {import('@napi-rs/canvas').Image | null} [texture]
 */
function paintHelpFooterSurface(ctx, width, height, accent, texture = null) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, width, height);

  if (texture) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.drawImage(texture, 0, 0, width, height);
    ctx.restore();
  }

  const vignette = ctx.createLinearGradient(0, 0, width, 0);
  vignette.addColorStop(0, "rgba(8,9,10,0.94)");
  vignette.addColorStop(0.45, "rgba(8,9,10,0.72)");
  vignette.addColorStop(1, "rgba(8,9,10,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const hex = accent.replace("#", "");
  const value = Number.parseInt(hex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const glow = ctx.createRadialGradient(
    width * 0.12,
    height,
    0,
    width * 0.12,
    height,
    width * 0.65,
  );
  glow.addColorStop(0, `rgba(${r},${g},${b},0.42)`);
  glow.addColorStop(0.55, `rgba(${r},${g},${b},0.12)`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

module.exports = {
  paintSurface,
  paintCard,
  paintGamePanel: paintCard,
  paintGameFrame,
  paintHelpFooterSurface,
};
