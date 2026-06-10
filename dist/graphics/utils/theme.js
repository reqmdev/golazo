"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTheme = resolveTheme;
const tokens_1 = require("../tokens");
const SPORTS_DARK = {
    id: 'sports_dark',
    canvas: tokens_1.colors.background.primary,
    surface: tokens_1.palette.surface,
    surfaceRaised: tokens_1.colors.background.elevated,
    surfaceHover: tokens_1.palette.surfaceHover,
    border: tokens_1.colors.border.default,
    borderSubtle: tokens_1.colors.border.subtle,
    textPrimary: tokens_1.colors.text.primary,
    textSecondary: tokens_1.colors.text.secondary,
    textMuted: tokens_1.colors.text.muted,
    accent: tokens_1.palette.accent,
    accentMuted: tokens_1.palette.blue,
    accentSoft: tokens_1.palette.accentSoft,
    success: tokens_1.palette.accent,
    warning: tokens_1.palette.amber,
    danger: tokens_1.palette.red,
    win: tokens_1.colors.semantic.win,
    draw: tokens_1.colors.semantic.draw,
    loss: tokens_1.colors.semantic.loss,
    rankGold: tokens_1.colors.semantic.gold,
    rankSilver: tokens_1.colors.semantic.silver,
    rankBronze: tokens_1.colors.semantic.bronze,
    shadow: 'rgba(0,0,0,0.45)',
};
const THEMES = {
    sports_dark: SPORTS_DARK,
    sports_light: {
        ...SPORTS_DARK,
        id: 'sports_light',
        canvas: '#ffffff',
        surface: '#f2f3f5',
        surfaceRaised: '#ffffff',
        surfaceHover: '#e3e5e8',
        border: '#d4d7dc',
        borderSubtle: '#e3e5e8',
        textPrimary: '#060607',
        textSecondary: '#4e5058',
        textMuted: '#6d6f78',
        shadow: 'rgba(0,0,0,0.08)',
    },
    discord_dark: SPORTS_DARK,
    discord_light: SPORTS_DARK,
};
function resolveTheme(themeId = 'sports_dark', overrides = {}) {
    const base = THEMES[themeId] || SPORTS_DARK;
    if (!overrides.primary) {
        return { ...base };
    }
    return {
        ...base,
        accent: overrides.primary,
        accentMuted: overrides.primary,
    };
}
//# sourceMappingURL=theme.js.map