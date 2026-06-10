import { colors, palette } from '../tokens';
import type { Theme } from '../core/types';

const SPORTS_DARK: Theme = {
  id: 'sports_dark',
  canvas: colors.background.primary,
  surface: palette.surface,
  surfaceRaised: colors.background.elevated,
  surfaceHover: palette.surfaceHover,
  border: colors.border.default,
  borderSubtle: colors.border.subtle,
  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textMuted: colors.text.muted,
  accent: palette.accent,
  accentMuted: palette.blue,
  accentSoft: palette.accentSoft,
  success: palette.accent,
  warning: palette.amber,
  danger: palette.red,
  win: colors.semantic.win,
  draw: colors.semantic.draw,
  loss: colors.semantic.loss,
  rankGold: colors.semantic.gold,
  rankSilver: colors.semantic.silver,
  rankBronze: colors.semantic.bronze,
  shadow: 'rgba(0,0,0,0.45)',
};

const THEMES: Record<string, Theme> = {
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

export function resolveTheme(themeId = 'sports_dark', overrides: { primary?: string } = {}): Theme {
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