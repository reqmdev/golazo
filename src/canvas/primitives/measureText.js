/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 */
function ellipsize(ctx, text, maxWidth) {
    if (!text) {
        return '';
    }

    if (ctx.measureText(text).width <= maxWidth) {
        return text;
    }

    const ellipsis = '…';
    let trimmed = text;

    while (trimmed.length > 0 && ctx.measureText(`${trimmed}${ellipsis}`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1);
    }

    return trimmed.length > 0 ? `${trimmed}${ellipsis}` : ellipsis;
}

module.exports = { ellipsize };