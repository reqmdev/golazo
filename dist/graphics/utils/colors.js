"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexWithAlpha = hexWithAlpha;
exports.contrastText = contrastText;
exports.resolveRankColor = resolveRankColor;
exports.resolveQualificationColor = resolveQualificationColor;
function parseHex(hex) {
    const normalized = hex.replace('#', '');
    if (normalized.length === 3) {
        const [r, g, b] = normalized.split('');
        return {
            r: parseInt(r + r, 16),
            g: parseInt(g + g, 16),
            b: parseInt(b + b, 16),
        };
    }
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
}
function hexWithAlpha(hex, alpha) {
    const { r, g, b } = parseHex(hex);
    return `rgba(${r},${g},${b},${alpha})`;
}
function contrastText(bgHex) {
    const { r, g, b } = parseHex(bgHex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#060607' : '#ffffff';
}
function resolveRankColor(rank, theme) {
    if (rank === 1)
        return theme.rankGold;
    if (rank === 2)
        return theme.rankSilver;
    if (rank === 3)
        return theme.rankBronze;
    return theme.textMuted;
}
function resolveQualificationColor(rank, theme) {
    if (rank === 1)
        return theme.rankGold;
    if (rank === 2)
        return theme.rankSilver;
    if (rank === 3)
        return theme.rankBronze;
    return null;
}
//# sourceMappingURL=colors.js.map