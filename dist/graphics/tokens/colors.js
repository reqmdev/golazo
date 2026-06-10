"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = exports.pro = exports.palette = void 0;
exports.palette = {
    bg: '#08090a',
    bgElevated: '#0f1115',
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceHover: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.04)',
    borderStrong: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accent: '#22c55e',
    accentSoft: 'rgba(34, 197, 94, 0.12)',
    blue: '#3b82f6',
    amber: '#f59e0b',
    red: '#ef4444',
    gold: '#fbbf24',
    silver: '#cbd5e1',
    bronze: '#d97706',
};
exports.pro = {
    cardSurface: '#0f1115',
    cardBorder: '#23272f',
    subtleTint: 'rgba(255, 255, 255, 0.015)',
    hairline: '#1f232b',
    headerLine: '#23272f',
};
exports.colors = {
    background: {
        primary: exports.palette.bg,
        elevated: exports.palette.bgElevated,
    },
    surface: {
        primary: exports.pro.cardSurface,
        subtleTint: exports.pro.subtleTint,
    },
    text: {
        primary: exports.palette.text,
        secondary: exports.palette.textSecondary,
        muted: exports.palette.textMuted,
    },
    accent: {
        default: exports.palette.accent,
        soft: exports.palette.accentSoft,
    },
    semantic: {
        win: exports.palette.accent,
        draw: exports.palette.textMuted,
        loss: exports.palette.red,
        gold: exports.palette.gold,
        silver: exports.palette.silver,
        bronze: exports.palette.bronze,
    },
    border: {
        default: exports.pro.cardBorder,
        subtle: '#1a1d24',
        hairline: exports.pro.hairline,
    },
};
//# sourceMappingURL=colors.js.map