const { fillRoundRect, strokeRoundRect } = require('../../league/render/utils/geometry');
const { drawTextFit } = require('../../league/render/drawing/drawTextFit');
const { setFont } = require('../../league/render/utils/typography');
const { RADII } = require('../tokens');

/**
 * Rectangular status chip.
 *
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, label: string, maxWidth?: number, fill?: string, textColor?: string, height?: number, radius?: number }} chip
 * @param {object} theme
 */
function drawChip(ctx, chip, theme) {
    const height = chip.height ?? 32;
    const paddingX = 14;
    const maxWidth = chip.maxWidth ?? 220;
    const radius = chip.radius ?? RADII.chip;

    setFont(ctx, 'chip');
    const textWidth = Math.min(maxWidth - paddingX * 2, ctx.measureText(chip.label).width);
    const chipWidth = Math.min(maxWidth, textWidth + paddingX * 2);
    const chipX = chip.x - chipWidth;
    const chipY = chip.y - height / 2;
    const fill = chip.fill ?? theme.accentSoft;

    fillRoundRect(ctx, chipX, chipY, chipWidth, height, radius, fill);
    strokeRoundRect(ctx, chipX + 0.5, chipY + 0.5, chipWidth - 1, height - 1, radius, theme.borderSubtle || theme.border, 1);

    drawTextFit(ctx, chip.label, chipX + chipWidth / 2, chip.y, chipWidth - 10, {
        variant: 'chip',
        color: chip.textColor ?? theme.accent,
        align: 'center',
        baseline: 'middle'
    });
}

const drawPill = drawChip;

module.exports = { drawChip, drawPill };