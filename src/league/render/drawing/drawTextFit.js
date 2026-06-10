const { setFont, truncateText } = require('../utils/typography');

/**
 * Draw text truncated to fit width.
 *
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {number} maxWidth
 * @param {{ variant?: string, color?: string, align?: CanvasTextAlign, baseline?: CanvasTextBaseline }} [style]
 */
function drawTextFit(ctx, text, x, y, maxWidth, style = {}) {
    setFont(ctx, style.variant || 'body', style.color);
    ctx.textAlign = style.align || 'left';
    ctx.textBaseline = style.baseline || 'alphabetic';

    const fitted = truncateText(ctx, text, maxWidth);
    ctx.fillText(fitted, x, y);

    return fitted;
}

module.exports = { drawTextFit };