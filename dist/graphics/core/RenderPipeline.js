"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderCard = renderCard;
const ResvgRenderer_1 = require("../renderers/ResvgRenderer");
const SharpPostProcessor_1 = require("../renderers/SharpPostProcessor");
const AssetCache_1 = require("./AssetCache");
const tokens_1 = require("../tokens");
async function renderCard(document, options) {
    const svg = document.serialize();
    const pngBuffer = (0, ResvgRenderer_1.renderSvgToPng)(svg, {
        width: options.width,
        height: options.height,
        theme: options.theme,
        scale: options.scale,
    });
    const stadiumBg = await (0, AssetCache_1.getAssetBuffer)(tokens_1.assetPaths.stadiumBg);
    return (0, SharpPostProcessor_1.postProcessPng)(pngBuffer, {
        width: options.width,
        height: options.height,
        scale: options.scale,
        backgroundVariant: options.backgroundVariant,
        stadiumBg,
        composites: options.composites,
    });
}
//# sourceMappingURL=RenderPipeline.js.map