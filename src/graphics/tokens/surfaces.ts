import { palette, pro } from './colors';

/** Layered surface system — mobile sports app depth without heavy shadows. */
export const surfaces = {
  base: palette.bg,
  canvas: '#07080a',
  raised: '#12151c',
  overlay: '#181c25',
  inset: '#0c0e12',
  hover: 'rgba(255, 255, 255, 0.04)',
  active: 'rgba(255, 255, 255, 0.06)',
  stroke: pro.cardBorder,
  strokeSubtle: pro.hairline,
  accentBar: palette.accent,
  highlight: 'rgba(255, 255, 255, 0.03)',
} as const;

export const depth = {
  borderWidth: 1,
  accentBarWidth: 3,
  insetHighlight: 'rgba(255, 255, 255, 0.04)',
} as const;