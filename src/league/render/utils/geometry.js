/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 */
function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 */
function fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    roundRect(ctx, x, y, width, height, radius);
    ctx.fill();
    ctx.restore();
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 */
function strokeRoundRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();
    ctx.restore();
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 */
function drawCard(ctx, x, y, width, height, theme) {
    fillRoundRect(ctx, x, y, width, height, 12, theme.surface);
    strokeRoundRect(ctx, x, y, width, height, 12, theme.borderSubtle, 1);
}

module.exports = {
    roundRect,
    fillRoundRect,
    strokeRoundRect,
    drawCard
};