const { paintCard } = require("./paintSurface");
const { setFont } = require("../../league/render/utils/typography");

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, width: number, height: number, scoreText: string, label?: string }} block
 * @param {object} theme
 */
function drawScoreHero(ctx, block, theme) {
  const { x, y, width, height, scoreText, label } = block;

  // Outer container (now flat pro via paintCard)
  paintCard(ctx, x, y, width, height, theme.surfaceRaised);

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  if (label) {
    setFont(ctx, "micro", theme.textMuted);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label.toUpperCase(), centerX, y + 16);
  }

  // Draw a "Scoreboard" style box for the actual numbers
  const boxWidth = 140;
  const boxHeight = 70;
  const boxX = centerX - boxWidth / 2;
  const boxY = centerY - boxHeight / 2 + 8;

  ctx.fillStyle = theme.surface;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
  ctx.fill();
  ctx.strokeStyle = theme.borderStrong;
  ctx.lineWidth = 1;
  ctx.stroke();

  setFont(ctx, "scoreMd", theme.textPrimary);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(scoreText, centerX, boxY + boxHeight / 2 + 2);
}

module.exports = { drawScoreHero };
