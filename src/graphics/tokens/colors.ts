export const palette = {
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
} as const;

export const pro = {
  cardSurface: '#0f1115',
  cardBorder: '#23272f',
  subtleTint: 'rgba(255, 255, 255, 0.015)',
  hairline: '#1f232b',
  headerLine: '#23272f',
} as const;

export const colors = {
  background: {
    primary: palette.bg,
    elevated: palette.bgElevated,
  },
  surface: {
    primary: pro.cardSurface,
    subtleTint: pro.subtleTint,
  },
  text: {
    primary: palette.text,
    secondary: palette.textSecondary,
    muted: palette.textMuted,
  },
  accent: {
    default: palette.accent,
    soft: palette.accentSoft,
  },
  semantic: {
    win: palette.accent,
    draw: palette.textMuted,
    loss: palette.red,
    gold: palette.gold,
    silver: palette.silver,
    bronze: palette.bronze,
  },
  border: {
    default: pro.cardBorder,
    subtle: '#1a1d24',
    hairline: pro.hairline,
  },
} as const;