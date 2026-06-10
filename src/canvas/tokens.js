/** Golazo canvas tokens — modern sports app (2024+), not retro game UI. */

const CANVAS_WIDTH = 1200;
const HELP_FOOTER_HEIGHT = 120;
const MARK_SIZE = 128;

const PALETTE = {
  bg: "#08090a",
  bgElevated: "#0f1115",
  surface: "rgba(255, 255, 255, 0.03)",
  surfaceHover: "rgba(255, 255, 255, 0.06)",
  // @deprecated (glassmorphism removed for SofaScore pro flat aesthetic)
  glass: "rgba(255, 255, 255, 0.04)",
  glassStroke: "rgba(255, 255, 255, 0.08)",
  glassHighlight: "rgba(255, 255, 255, 0.12)",
  border: "rgba(255, 255, 255, 0.04)",
  borderStrong: "rgba(255, 255, 255, 0.08)",
  text: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  accent: "#22c55e",
  accentSoft: "rgba(34, 197, 94, 0.12)",
  blue: "#3b82f6",
  blueSoft: "rgba(59, 130, 246, 0.12)",
  amber: "#f59e0b",
  red: "#ef4444",
  gold: "#fbbf24",
  silver: "#cbd5e1",
  bronze: "#d97706",
};

// Pro flat / SofaScore tokens (single source of truth for enterprise sports data cards)
const PRO = {
  cardSurface: "#0f1115",      // flat elevated surface (no glass)
  cardBorder: "#23272f",       // hairline 1px
  subtleTint: "rgba(255, 255, 255, 0.015)", // minimal zebra/row only
  hairline: "#1f232b",
  headerLine: "#23272f",
};

const BRAND = {
  green: PALETTE.accent,
  league: PALETTE.accent,
  info: PALETTE.blue,
  utility: "#06b6d4",
  warning: PALETTE.amber,
  danger: PALETTE.red,
  neutral: PALETTE.textMuted,
  tips: "#a855f7",
};

const SURFACE = {
  canvas: PALETTE.bg,
  surface: PALETTE.surface,
  surfaceRaised: PALETTE.bgElevated,
  surfaceHover: PALETTE.surfaceHover,
  border: "#23272f",
  borderSubtle: "#1a1d24",
  floor: "#08090c",
  // Pro flat SofaScore surfaces (preferred)
  proCard: PRO.cardSurface,
  proBorder: PRO.cardBorder,
  hairline: PRO.hairline,
};

const TEXT = {
  primary: PALETTE.text,
  secondary: PALETTE.textSecondary,
  muted: PALETTE.textMuted,
  score: PALETTE.text,
};

const SEMANTIC = {
  success: PALETTE.accent,
  warning: PALETTE.amber,
  danger: PALETTE.red,
  win: PALETTE.accent,
  draw: PALETTE.textMuted,
  loss: PALETTE.red,
  rankGold: PALETTE.gold,
  rankSilver: PALETTE.silver,
  rankBronze: PALETTE.bronze,
};

const RADII = {
  panel: 10,   // tighter for pro flat
  card: 8,
  chip: 6,
  logo: 6,     // SofaScore-style tight rounded squares
};

const SPACING = {
  padding: 28,
  headerHeight: 100,
  headerGap: 16,
  footerHeight: 40,
};

const PAGE_ACCENTS = {
  overview: PALETTE.accent,
  league_step_1: "#16a34a",
  league_step_2: "#22c55e",
  league_step_3: "#4ade80",
  league_step_4: PALETTE.blue,
  league_step_5: PALETTE.amber,
  league_step_6: PALETTE.gold,
  teams: PALETTE.blue,
  matches: PALETTE.amber,
  admin: PALETTE.red,
  commands: "#06b6d4",
  tips: "#a855f7",
};

const ASSET_PATHS = {
  stadiumBg: "backgrounds/stadium-modern.png",
  helpHud: "backgrounds/help-bar-modern.png",
  brandMark: "brand/golazo-mark.png",
  brandMarkHi: "brand/golazo-mark-512.png",
  noiseTile: "backgrounds/noise-subtle.png",
};

/**
 * @param {string} hex
 */
function hexToDiscordColor(hex) {
  if (hex.startsWith("rgba")) {
    return 0x22c55e;
  }

  return Number.parseInt(hex.replace("#", ""), 16);
}

/**
 * @returns {Record<string, number>}
 */
function buildHelpColors() {
  return Object.fromEntries(
    Object.entries(PAGE_ACCENTS).map(([pageId, hex]) => [
      pageId,
      hexToDiscordColor(hex),
    ]),
  );
}

module.exports = {
  CANVAS_WIDTH,
  HELP_FOOTER_HEIGHT,
  MARK_SIZE,
  PALETTE,
  BRAND,
  SURFACE,
  TEXT,
  SEMANTIC,
  RADII,
  SPACING,
  PAGE_ACCENTS,
  ASSET_PATHS,
  PRO, // new pro flat / SofaScore tokens
  hexToDiscordColor,
  buildHelpColors,
};
