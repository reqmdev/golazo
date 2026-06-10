const { createCanvas } = require('@napi-rs/canvas');
const { LAYOUT } = require('../constants/layout');
const { ensureFonts } = require('./FontLoader');

/**
 * @param {number} width
 * @param {number} height
 * @param {{ scale?: number }} [opts] - pass scale:2 for crisp 2x exports (Discord will display sharp)
 */
function createRenderCanvas(width = LAYOUT.width, height = 400, opts = {}) {
    ensureFonts();
    const scale = opts.scale || 1;
    const canvas = createCanvas(Math.floor(width * scale), Math.floor(height * scale));
    const ctx = canvas.getContext('2d');
    ctx.antialias = 'subpixel';
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }
    return { canvas, ctx, width, height, scale };
}

module.exports = {
    createRenderCanvas
};