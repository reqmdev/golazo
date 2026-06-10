const { RADII } = require('../tokens');
const { fillRoundRect, strokeRoundRect } = require('../../league/render/utils/geometry');
const { setFont } = require('../../league/render/utils/typography');

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {number} width
 * @param {number} y
 * @param {number} activeStep 0 = all neutral
 * @param {string} accent
 * @param {object} theme
 */
function drawStepRail(ctx, width, y, activeStep, accent, theme) {
    const total = 6;
    const margin = 200;
    const trackStart = margin;
    const trackEnd = width - margin;
    const span = trackEnd - trackStart;
    const trackY = y;

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(trackStart, trackY);
    ctx.lineTo(trackEnd, trackY);
    ctx.stroke();

    if (activeStep > 1) {
        const progressEnd = trackStart + (span * (activeStep - 1)) / (total - 1);
        ctx.strokeStyle = accent;
        ctx.beginPath();
        ctx.moveTo(trackStart, trackY);
        ctx.lineTo(progressEnd, trackY);
        ctx.stroke();
    }

    for (let step = 1; step <= total; step++) {
        const centerX = trackStart + (span * (step - 1)) / (total - 1);
        const active = activeStep > 0 && step === activeStep;
        const done = activeStep > 0 && step < activeStep;
        const size = active ? 36 : 30;
        const boxX = centerX - size / 2;
        const boxY = trackY - size / 2;

        const fill = active ? accent : done ? theme.accentSoft : theme.surfaceHover;
        fillRoundRect(ctx, boxX, boxY, size, size, RADII.chip, fill);

        if (active || done) {
            strokeRoundRect(ctx, boxX + 0.5, boxY + 0.5, size - 1, size - 1, RADII.chip, active ? accent : theme.border, 1.5);
        } else {
            strokeRoundRect(ctx, boxX + 0.5, boxY + 0.5, size - 1, size - 1, RADII.chip, theme.border, 1);
        }

        setFont(ctx, active ? 'stepActive' : 'stepIdle', active ? '#052e16' : done ? accent : theme.textMuted);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(step), centerX, trackY + 1);
    }
}

module.exports = { drawStepRail };