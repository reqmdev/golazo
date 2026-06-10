const { fillRoundRect, strokeRoundRect } = require('../utils/geometry');
const { setFont } = require('../utils/typography');
const { contrastText } = require('../utils/colors');
const { PALETTE } = require('../../../canvas/tokens');

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, label: string, color?: string, width?: number, height?: number }} opts
 * @param {object} theme
 */
function drawBadge(ctx, opts, theme) {
    const {
        x,
        y,
        label,
        color = theme.accent,
        width = 32,
        height = 26
    } = opts;

    fillRoundRect(ctx, x, y, width, height, 6, color);
    strokeRoundRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 6, PALETTE.borderStrong, 1);
    setFont(ctx, 'caption', contrastText(color));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height / 2 + 0.5);
}

module.exports = { drawBadge };