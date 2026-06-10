"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureText = measureText;
exports.truncateText = truncateText;
exports.teamInitials = teamInitials;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const opentype = __importStar(require("opentype.js"));
const styles_1 = require("./styles");
const FontRegistry_1 = require("../core/FontRegistry");
const fontCache = new Map();
function projectRoot() {
    return path.join(__dirname, '..', '..', '..');
}
function loadFont(variant) {
    const spec = styles_1.typeScale[variant];
    const weightKey = spec.weight >= 700 ? 'Bold' : spec.weight >= 600 ? 'SemiBold' : spec.weight >= 500 ? 'Medium' : 'Regular';
    const familyKey = spec.family === 'GolazoMono' ? 'JetBrainsMono' : 'Inter';
    const cacheKey = `${familyKey}-${weightKey}`;
    if (fontCache.has(cacheKey)) {
        return fontCache.get(cacheKey);
    }
    const fontsDir = path.join(projectRoot(), 'src', 'assets', 'fonts');
    const candidates = [
        path.join(fontsDir, `${familyKey}-${weightKey}.ttf`),
        path.join(fontsDir, `${familyKey}-Regular.ttf`),
    ];
    for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
            const font = opentype.parse(fs.readFileSync(filePath));
            fontCache.set(cacheKey, font);
            return font;
        }
    }
    const registry = (0, FontRegistry_1.getFontRegistry)();
    for (const filePath of registry.getFontFiles()) {
        if (fs.existsSync(filePath)) {
            try {
                const font = opentype.parse(fs.readFileSync(filePath));
                fontCache.set(cacheKey, font);
                return font;
            }
            catch {
                // try next
            }
        }
    }
    return null;
}
function measureText(variant, text) {
    const font = loadFont(variant);
    const spec = styles_1.typeScale[variant];
    if (!font)
        return text.length * spec.size * 0.55;
    return font.getAdvanceWidth(text, spec.size);
}
function truncateText(variant, text, maxWidth) {
    if (!text)
        return '';
    if (measureText(variant, text) <= maxWidth)
        return text;
    const ellipsis = '…';
    let low = 0;
    let high = text.length;
    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        const candidate = `${text.slice(0, mid)}${ellipsis}`;
        if (measureText(variant, candidate) <= maxWidth) {
            low = mid;
        }
        else {
            high = mid - 1;
        }
    }
    return `${text.slice(0, low)}${ellipsis}`;
}
function teamInitials(name, maxLen = 2) {
    if (!name)
        return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase().slice(0, maxLen);
    }
    return name.trim().slice(0, maxLen).toUpperCase();
}
//# sourceMappingURL=TextMeasurer.js.map