const { fillRoundRect, strokeRoundRect } = require("../utils/geometry");
const { drawTextFit } = require("./drawTextFit");
const { drawFormIndicators } = require("./drawFormIndicators");
const { setFont, teamInitials } = require("../utils/typography");
const { contrastText } = require("../utils/colors");
const { LAYOUT } = require("../constants/layout");
const { RADII } = require("../../../canvas/tokens");

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {import('@napi-rs/canvas').Image | null} image
 * @param {{ name: string, color?: string }} team
 */
function drawTeamLogo(ctx, x, y, size, image, team) {
  // SofaScore-style clean containment: neutral container + thin hairline, logo clipped inside.
  // Colored fallback bg only for initials (no logo).
  const r = RADII.logo;
  const container = "#111318";
  const ring = "#23272f";

  fillRoundRect(ctx, x, y, size, size, r, container);
  strokeRoundRect(ctx, x + 0.5, y + 0.5, size - 1, size - 1, r, ring, 1);

  if (image) {
    ctx.save();
    // clip strictly inside the ring
    fillRoundRect(ctx, x + 1, y + 1, size - 2, size - 2, Math.max(2, r - 1), "#000");
    ctx.clip();
    ctx.drawImage(image, x + 1, y + 1, size - 2, size - 2);
    ctx.restore();
    return;
  }

  // Fallback initials on colored or neutral
  const color = team.color || "#2a2f38";
  fillRoundRect(ctx, x + 1, y + 1, size - 2, size - 2, Math.max(2, r - 1), color);
  setFont(ctx, "caption", contrastText(color));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(teamInitials(team.name), x + size / 2, y + size / 2 + 1);
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, width: number, height: number, team: object, logo?: import('@napi-rs/canvas').Image | null, rank?: number, showForm?: boolean }} row
 * @param {object} theme
 */
function drawTeamRow(ctx, row, theme) {
  const {
    x,
    y,
    width,
    height,
    team,
    logo = null,
    rank,
    showForm = false,
  } = row;

  const logoSize = LAYOUT.logoSize;
  const logoX = x;
  const logoY = y + (height - logoSize) / 2 - (showForm ? 8 : 0);

  drawTeamLogo(ctx, logoX, logoY, logoSize, logo, team);

  const textX = logoX + logoSize + 12;
  const textWidth = width - (logoSize + 16);

  if (showForm && team.form) {
    // Name higher up
    drawTextFit(
      ctx,
      team.displayName || team.name,
      textX,
      y + height / 2 - 4,
      textWidth,
      {
        variant: "body",
        color: theme.textPrimary,
        baseline: "bottom",
      },
    );

    // Form below name
    drawFormIndicators(
      ctx,
      {
        x: textX,
        y: y + height / 2 + 5,
        form: team.form,
        dotSize: 13,
        gap: 3,
      },
      theme,
    );
  } else {
    drawTextFit(
      ctx,
      team.displayName || team.name,
      textX,
      y + height / 2,
      textWidth,
      {
        variant: "body",
        color: theme.textPrimary,
        baseline: "middle",
      },
    );
  }
}

module.exports = {
  drawTeamLogo,
  drawTeamRow,
};
