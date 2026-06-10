"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSvgToPng = renderSvgToPng;
const resvg_js_1 = require("@resvg/resvg-js");
const FontRegistry_1 = require("../core/FontRegistry");
function renderSvgToPng(svg, options) {
    const scale = options.scale ?? 2;
    const registry = (0, FontRegistry_1.getFontRegistry)();
    const resvg = new resvg_js_1.Resvg(svg, {
        background: options.theme.canvas,
        fitTo: { mode: 'zoom', value: scale },
        font: registry.getResvgFontOptions(),
        dpi: 96,
        shapeRendering: 2,
        textRendering: 1,
        imageRendering: 0,
        logLevel: 'off',
    });
    const pngData = resvg.render();
    return pngData.asPng();
}
//# sourceMappingURL=ResvgRenderer.js.map