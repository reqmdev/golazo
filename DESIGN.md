# Golazo Canvas Design System

**Lane:** SofaScore / 2024+ pro football data app (clean, data-dense, trustworthy sports UI). Explicitly **not** glassmorphism, liquid glass, heavy drop shadows, noise overlays, broadcast HUDs, or retro game menus.

## Atmosphere (SofaScore-aligned)

- Solid dark base `#08090a` / elevated `#0f1115`; minimal tints only for separation.
- Single accent green `#22c55e` (or per-league) for live, points, GD+, winners; gold/silver/bronze for top-3 ranks/qual.
- **Hairline 1px borders and dividers only** — no glow, no 16px+ shadows, no decorative noise, no glass fills or highlight gradients on cards.
- Stadium photo (very low opacity ~8-12%) only as subtle atmospheric wash under data; data areas must remain high-contrast and crisp.
- Zero "AI premium" effects. Every pixel earns its place.

## Canvas

- Fixed width: 920px (Discord-friendly; scalable via future `scale` factor in CanvasFactory for 2x crisp exports).
- Typography: Inter-family (Golazo alias) for UI + JetBrains Mono (GolazoMono) for all scores/stats/numbers. Sentence case or minimal UPPER for column headers only. Tabular alignment for numbers.
- High density with breathing room and perfect optical alignment.

## Components (flat, pro, SofaScore-like)

- **Header**: restrained weight (smaller or left-leaning title + subtle accent), minimal badge chip. No dominant centered display.
- **DataTable (Standings)**: flat or hairline outer, left colored qualification bars (top-3 gold/silver/bronze), subtle rank circles/pills for 1-3, hairline row dividers, form as 5 tight colored circles under team name, points emphasized, GD colored.
- **Fixture rows**: minimal per-match blocks or clean rows (little to no card chrome). Clean center score/time box. Clear visual distinction between played (score) and upcoming.
- **MatchResult hero**: classic horizontal Sofa layout — home (logo + name) | large confident mono score + subtle FT/WO/LIVE chip | away (logo + name). Winner indicated by name weight + tiny accent marker (no 6px bar). No glass scoreboard box.
- **Team logo**: tight rounded square (radius 6-8px), thin neutral containment or none; colored fallback bg only when no logo; crisp clip.
- **HelpFooterRail**: kept functional (emoji + label, step rail, brand); apply same flat tokens.

## Banned (enforced by code + review)
- Glassmorphism / liquid glass (rgba white fills + strokes + gradients).
- Large drop shadows (anything > ~6-8px blur) or paired border+shadow.
- Noise pattern overlays on cards.
- Over-rounded radii (>12-14px on cards; logos 6-8px).
- Magic numbers / duplicated box drawing in renderers (all measurements from LAYOUT + tokens).
- UPPERCASE everything; display fonts in data labels.

## Assets

Place under `src/assets/canvas/` then run `npm run sync-canvas-assets`.

| File | Path | Size |
|------|------|------|
| Stadium background | `backgrounds/stadium-modern.png` | 920×700 |
| Help footer texture | `backgrounds/help-bar-modern.png` | 920×140 |
| Brand mark | `brand/golazo-mark.png` | 512×512 transparent |
| Noise tile (optional, use very sparingly) | `backgrounds/noise-subtle.png` | 256×256 tile |

See `src/canvas/tokens.js` and `src/league/render/constants/layout.js` for the single source of truth. All renderers must derive sizes, radii, gaps, and colors from these.