const { AttachmentBuilder } = require("discord.js");
const { resolveTheme } = require("../constants/theme");
const { getImage } = require("../core/ImageCache");
const {
  paintSurface,
  paintGameFrame,
} = require("../../../canvas/primitives/paintSurface");
const { getAssetImage } = require("../../../canvas/loadAsset");
const { ASSET_PATHS } = require("../../../canvas/tokens");
const { setFont } = require("../utils/typography");

const BACKGROUND_VARIANTS = {
  data: 0.1,
  hero: 0.24,
};

class BaseRenderer {
  /**
   * @param {{ themeId?: string, accentColor?: string }} [options]
   */
  constructor(options = {}) {
    this.theme = resolveTheme(options.themeId, {
      primary: options.accentColor,
    });
    /** @type {import('@napi-rs/canvas').Image | null} */
    this._stadiumBg = null;
    /** @type {import('@napi-rs/canvas').Image | null} */
    this._noiseTile = null;
    this._assetsLoaded = false;
  }

  /**
   * @param {object} view
   */
  async render(view) {
    throw new Error(`${this.constructor.name}.render() not implemented`);
  }

  async ensureAssets() {
    if (this._assetsLoaded) {
      return;
    }

    this._assetsLoaded = true;
    this._stadiumBg = await getAssetImage(ASSET_PATHS.stadiumBg);
    this._noiseTile = await getAssetImage(ASSET_PATHS.noiseTile);
  }

  /**
   * @param {import('@napi-rs/canvas').Canvas} canvas
   */
  toBuffer(canvas) {
    return canvas.toBuffer("image/png");
  }

  /**
   * @param {Buffer} buffer
   * @param {string} filename
   */
  toAttachment(buffer, filename) {
    return BaseRenderer.toAttachment(buffer, filename);
  }

  /**
   * @param {Buffer} buffer
   * @param {string} filename
   */
  static toAttachment(buffer, filename) {
    return new AttachmentBuilder(buffer, { name: filename });
  }

  /**
   * @param {Array<{ id: string, logoUrl?: string | null }>} teams
   */
  async loadLogos(teams) {
    /** @type {Map<string, import('@napi-rs/canvas').Image | null>} */
    const logos = new Map();
    const unique = new Map();

    for (const team of teams) {
      if (!team?.id || unique.has(team.id)) continue;
      unique.set(team.id, team.logoUrl || null);
    }

    await Promise.all(
      [...unique.entries()].map(async ([id, url]) => {
        logos.set(id, url ? await getImage(url) : null);
      }),
    );

    return logos;
  }

  /**
   * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
   * @param {number} width
   * @param {number} height
   * @param {'data' | 'hero'} [variant]
   */
  async paintBackground(ctx, width, height, variant = "hero") {
    await this.ensureAssets();
    paintSurface(ctx, width, height, {
      cover: this._stadiumBg,
      coverOpacity: BACKGROUND_VARIANTS[variant] ?? BACKGROUND_VARIANTS.hero,
    });

    // Pass the noise tile to the context if we want it globally or for specific primitives
    if (this._noiseTile) {
      ctx.noiseTile = this._noiseTile;
    }

    paintGameFrame(ctx, width, height);
  }

  /**
   * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {string} text
   */
  drawWatermark(ctx, x, y, width, text) {
    ctx.save();
    setFont(ctx, "watermark", `${this.theme.textMuted}66`);
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(text, x + width, y);
    ctx.restore();
  }
}

module.exports = BaseRenderer;
