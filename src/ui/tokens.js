/** Embed accent colors (decimal for Discord.js setColor). */
const EMBED_COLORS = {
    brand: 0x3ba55d,
    info: 0x5865f2,
    success: 0x3ba55d,
    warning: 0xfaa81a,
    danger: 0xed4245,
    neutral: 0x5865f2,
    muted: 0x4e5058,
    league: 0x2d6a4f,
    leagueCard: 0x3d5a4c,
    utility: 0x00b0f4
};

/** @type {Record<string, number>} */
const VARIANT_COLORS = {
    full: EMBED_COLORS.brand,
    canvas: EMBED_COLORS.league,
    utility: EMBED_COLORS.utility,
    success: EMBED_COLORS.success,
    info: EMBED_COLORS.info,
    compact: EMBED_COLORS.danger,
    warning: EMBED_COLORS.warning,
    danger: EMBED_COLORS.danger,
    league: EMBED_COLORS.league,
    leagueCard: EMBED_COLORS.leagueCard,
    neutral: EMBED_COLORS.neutral,
    muted: EMBED_COLORS.muted
};

const LIMITS = {
    title: 256,
    description: 4096,
    fieldName: 256,
    fieldValue: 1024,
    footer: 2048,
    author: 256,
    compactDescription: 300,
    utilityFieldCount: 4
};

const MARK_FILENAME = 'golazo-mark.png';

module.exports = {
    EMBED_COLORS,
    VARIANT_COLORS,
    LIMITS,
    MARK_FILENAME
};