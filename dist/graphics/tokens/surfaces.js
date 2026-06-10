"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depth = exports.surfaces = void 0;
const colors_1 = require("./colors");
/** Layered surface system — mobile sports app depth without heavy shadows. */
exports.surfaces = {
    base: colors_1.palette.bg,
    canvas: '#07080a',
    raised: '#12151c',
    overlay: '#181c25',
    inset: '#0c0e12',
    hover: 'rgba(255, 255, 255, 0.04)',
    active: 'rgba(255, 255, 255, 0.06)',
    stroke: colors_1.pro.cardBorder,
    strokeSubtle: colors_1.pro.hairline,
    accentBar: colors_1.palette.accent,
    highlight: 'rgba(255, 255, 255, 0.03)',
};
exports.depth = {
    borderWidth: 1,
    accentBarWidth: 3,
    insetHighlight: 'rgba(255, 255, 255, 0.04)',
};
//# sourceMappingURL=surfaces.js.map