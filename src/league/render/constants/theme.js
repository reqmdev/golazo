const { SURFACE, TEXT, SEMANTIC, BRAND, PALETTE } = require('../../../canvas/tokens');

/** Modern sports-app theme for league canvas cards. */
const SPORTS_DARK = {
    id: 'sports_dark',
    canvas: SURFACE.canvas,
    surface: SURFACE.surface,
    surfaceRaised: SURFACE.surfaceRaised,
    surfaceHover: SURFACE.surfaceHover,
    border: SURFACE.border,
    borderSubtle: SURFACE.borderSubtle,
    textPrimary: TEXT.primary,
    textSecondary: TEXT.secondary,
    textMuted: TEXT.muted,
    accent: PALETTE.accent,
    accentMuted: PALETTE.blue,
    accentSoft: PALETTE.accentSoft,
    success: SEMANTIC.success,
    warning: SEMANTIC.warning,
    danger: SEMANTIC.danger,
    win: SEMANTIC.win,
    draw: SEMANTIC.draw,
    loss: SEMANTIC.loss,
    rankGold: SEMANTIC.rankGold,
    rankSilver: SEMANTIC.rankSilver,
    rankBronze: SEMANTIC.rankBronze,
    shadow: 'rgba(0,0,0,0.45)'
};

const SPORTS_LIGHT = {
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
    shadow: 'rgba(0,0,0,0.08)'
};

const THEMES = {
    sports_dark: SPORTS_DARK,
    sports_light: SPORTS_LIGHT,
    discord_dark: SPORTS_DARK,
    discord_light: SPORTS_LIGHT
};

/**
 * @param {string} [themeId]
 * @param {{ primary?: string }} [overrides]
 */
function resolveTheme(themeId = 'sports_dark', overrides = {}) {
    const base = THEMES[themeId] || SPORTS_DARK;

    if (!overrides.primary) {
        return { ...base };
    }

    return {
        ...base,
        accent: overrides.primary,
        accentMuted: overrides.primary
    };
}

module.exports = {
    SPORTS_DARK,
    SPORTS_LIGHT,
    DISCORD_DARK: SPORTS_DARK,
    DISCORD_LIGHT: SPORTS_LIGHT,
    THEMES,
    resolveTheme,
    BRAND
};