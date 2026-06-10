const { fillRoundRect, strokeRoundRect } = require("../utils/geometry");
const { setFont } = require("../utils/typography");
const { contrastText } = require("../utils/colors");

const FORM_COLORS = {
  W: (theme) => theme.win,
  D: (theme) => theme.draw,
  L: (theme) => theme.loss,
};

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, form: string[], dotSize?: number, gap?: number }} opts
 * @param {object} theme
 */
function drawFormIndicators(ctx, opts, theme) {
  const { x, y, form = [], dotSize = 14, gap = 4 } = opts;
  const items = form.slice(-5);

  // Sofascore uses perfect circles for form
  const radius = dotSize / 2;

  for (let i = 0; i < 5; i += 1) {
    const letter = items[i];
    const dx = x + i * (dotSize + gap);
    const color =
      letter && FORM_COLORS[letter]
        ? FORM_COLORS[letter](theme)
        : "rgba(255,255,255,0.05)";

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dx + radius, y + radius, radius, 0, Math.PI * 2);
    ctx.fill();

    // Remove letter rendering — use only colors as requested
  }
}

module.exports = { drawFormIndicators };
