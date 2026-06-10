const TYPE_SCALE = {
  display: { size: 38, weight: "700", family: "display" },
  title: { size: 24, weight: "700", family: "display" },
  subtitle: { size: 16, weight: "600", family: "body" },
  body: { size: 16, weight: "500", family: "body" },
  caption: { size: 13, weight: "500", family: "body" },
  chip: { size: 13, weight: "600", family: "body" },
  micro: { size: 11, weight: "700", family: "body" },
  stat: { size: 15, weight: "700", family: "mono" },
  scoreMd: { size: 24, weight: "700", family: "mono" },
  scoreLg: { size: 48, weight: "700", family: "mono" },
  stepActive: { size: 15, weight: "700", family: "body" },
  stepIdle: { size: 14, weight: "600", family: "body" },
  watermark: { size: 12, weight: "500", family: "body" },
};

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {keyof TYPE_SCALE} variant
 * @param {string} [color]
 */
function setFont(ctx, variant, color) {
  const spec = TYPE_SCALE[variant] || TYPE_SCALE.body;
  const family = spec.family === "mono" ? "GolazoMono" : "Golazo";
  ctx.font = `${spec.weight} ${spec.size}px "${family}"`;

  if (color) {
    ctx.fillStyle = color;
  }
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 */
function measureFittedWidth(ctx, text, maxWidth) {
  return Math.min(ctx.measureText(text).width, maxWidth);
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 */
function truncateText(ctx, text, maxWidth) {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;

  const ellipsis = "…";
  let low = 0;
  let high = text.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = `${text.slice(0, mid)}${ellipsis}`;

    if (ctx.measureText(candidate).width <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return `${text.slice(0, low)}${ellipsis}`;
}

/**
 * @param {string} name
 * @param {number} [maxLen]
 */
function teamInitials(name, maxLen = 2) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase().slice(0, maxLen);
  }

  return name.trim().slice(0, maxLen).toUpperCase();
}

module.exports = {
  TYPE_SCALE,
  setFont,
  measureFittedWidth,
  truncateText,
  teamInitials,
};
