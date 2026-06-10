"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postProcessPng = postProcessPng;
const sharp_1 = __importDefault(require("sharp"));
const BACKGROUND_OPACITY = {
    data: 0.16,
    hero: 0.32,
};
async function postProcessPng(pngBuffer, options) {
    const scale = options.scale ?? 2;
    const outWidth = Math.floor(options.width * scale);
    const outHeight = Math.floor(options.height * scale);
    const opacity = BACKGROUND_OPACITY[options.backgroundVariant ?? 'hero'] ?? 0.12;
    const foreground = await (0, sharp_1.default)(pngBuffer)
        .resize(outWidth, outHeight, { fit: 'fill' })
        .png()
        .toBuffer();
    const overlayComposites = [{ input: foreground, blend: 'over' }];
    if (options.composites?.length) {
        for (const layer of options.composites) {
            let input = layer.input;
            if (layer.opacity !== undefined && layer.opacity < 1) {
                input = await (0, sharp_1.default)(layer.input).ensureAlpha(layer.opacity).toBuffer();
            }
            overlayComposites.push({
                input,
                left: layer.left !== undefined ? Math.floor(layer.left * scale) : undefined,
                top: layer.top !== undefined ? Math.floor(layer.top * scale) : undefined,
                blend: layer.blend ?? 'over',
            });
        }
    }
    if (options.stadiumBg) {
        const fadedBg = await (0, sharp_1.default)(options.stadiumBg)
            .resize(outWidth, outHeight, { fit: 'cover' })
            .ensureAlpha(opacity)
            .toBuffer();
        return (0, sharp_1.default)(fadedBg)
            .composite(overlayComposites)
            .png({ compressionLevel: 6, quality: 90 })
            .toBuffer();
    }
    return (0, sharp_1.default)(foreground)
        .png({ compressionLevel: 6, quality: 90 })
        .toBuffer();
}
//# sourceMappingURL=SharpPostProcessor.js.map