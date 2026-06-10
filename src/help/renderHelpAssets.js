const path = require('path');
const fs = require('fs');
const config = require('../config');
const { createRenderCanvas } = require('../league/render/core/CanvasFactory');
const { getPageVisual } = require('./visualMeta');
const { CANVAS_WIDTH, HELP_FOOTER_HEIGHT, MARK_SIZE, ASSET_PATHS } = require('../canvas/tokens');
const { fillRoundRect } = require('../league/render/utils/geometry');
const { getAssetImage, resolveAssetPath, ASSETS_ROOT } = require('../canvas/loadAsset');
const { SPORTS_DARK } = require('../league/render/constants/theme');
const { setFont, truncateText } = require('../league/render/utils/typography');

const LEGACY_ASSETS_ROOT = path.join(__dirname, '..', 'assets', 'help', 'generated');

/**
 * @param {string} hex
 * @param {number} alpha
 */
function accentRgba(hex, alpha) {
    const normalized = hex.replace('#', '');
    const value = Number.parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;

    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * @param {string} pageId
 * @param {(key: string) => string} tr
 */
function buildHelpBannerInput(pageId, tr) {
    const visual = getPageVisual(pageId);
    const heroTitle = tr(`help.pages.${pageId}.bannerTitle`);
    const heroSubtitle = tr(`help.pages.${pageId}.bannerSubtitle`);
    const brandLabel = tr('help.trailerBrand');
    const fallbackTitle = tr(`help.pages.${pageId}.title`);

    return {
        pageId,
        heroTitle: heroTitle.startsWith('help.') ? fallbackTitle : heroTitle,
        heroSubtitle: heroSubtitle.startsWith('help.pages.') ? '' : heroSubtitle,
        brandLabel: brandLabel.startsWith('help.') ? 'GOLAZO' : brandLabel,
        accent: visual.accent,
    };
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {string} accent
 * @param {import('@napi-rs/canvas').Image | null} [texture]
 */
function paintHelpStripSurface(ctx, width, height, accent, texture = null) {
    const theme = SPORTS_DARK;

    ctx.fillStyle = theme.canvas;
    ctx.fillRect(0, 0, width, height);

    if (texture) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.drawImage(texture, 0, 0, width, height);
        ctx.restore();
    }

    const wash = ctx.createLinearGradient(0, 0, 0, height);
    wash.addColorStop(0, 'rgba(8,9,10,0.55)');
    wash.addColorStop(1, 'rgba(8,9,10,0.92)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    const accentBar = ctx.createLinearGradient(0, 0, width, 0);
    accentBar.addColorStop(0, accentRgba(accent, 0));
    accentBar.addColorStop(0.35, accentRgba(accent, 0.85));
    accentBar.addColorStop(1, accentRgba(accent, 0.35));
    ctx.fillStyle = accentBar;
    ctx.fillRect(0, height - 5, width, 5);
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {ReturnType<typeof buildHelpBannerInput>} input
 */
function drawHelpStripContent(ctx, input) {
    const theme = SPORTS_DARK;
    const maxTitleWidth = CANVAS_WIDTH - 220;

    setFont(ctx, 'subtitle', theme.text);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(truncateText(ctx, input.heroTitle, maxTitleWidth), 36, HELP_FOOTER_HEIGHT / 2 - 6);

    if (input.heroSubtitle) {
        setFont(ctx, 'caption', theme.textMuted);
        ctx.fillText(truncateText(ctx, input.heroSubtitle, maxTitleWidth), 36, HELP_FOOTER_HEIGHT / 2 + 16);
    }

    setFont(ctx, 'micro', theme.textSecondary);
    ctx.textAlign = 'right';
    ctx.fillText(String(input.brandLabel).toUpperCase(), CANVAS_WIDTH - 36, HELP_FOOTER_HEIGHT / 2);
}

function shouldUseSvgHelp() {
    const renderConfig = config.render || {};
    if (renderConfig.engine === 'svg') return true;
    return renderConfig.svgCards?.includes('help_footer');
}

/**
 * @param {string} pageId
 * @param {(key: string) => string} tr
 */
async function renderHelpFooterSvg(pageId, tr) {
    const input = buildHelpBannerInput(pageId, tr);

    try {
        const adapters = require('../../dist/graphics/adapters');
        return adapters.renderHelpFooterSvg(input);
    } catch (err) {
        console.warn('[renderHelpAssets] SVG help footer failed, using canvas:', err.message);
        return renderHelpFooterCanvas(pageId, tr);
    }
}

async function renderHelpFooterCanvas(pageId, tr) {
    const input = buildHelpBannerInput(pageId, tr);
    const { canvas, ctx } = createRenderCanvas(CANVAS_WIDTH, HELP_FOOTER_HEIGHT);
    const stadium = await getAssetImage(ASSET_PATHS.stadiumBg);

    paintHelpStripSurface(ctx, CANVAS_WIDTH, HELP_FOOTER_HEIGHT, input.accent, stadium);
    drawHelpStripContent(ctx, input);

    return canvas.toBuffer('image/png');
}

async function renderHelpFooter(pageId, tr) {
    if (shouldUseSvgHelp()) {
        return renderHelpFooterSvg(pageId, tr);
    }

    return renderHelpFooterCanvas(pageId, tr);
}

function renderBrandMarkCanvas() {
    const theme = SPORTS_DARK;
    const { canvas, ctx } = createRenderCanvas(MARK_SIZE, MARK_SIZE);

    fillRoundRect(ctx, 8, 8, MARK_SIZE - 16, MARK_SIZE - 16, 20, theme.surfaceRaised);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    fillRoundRect(ctx, 28, 28, MARK_SIZE - 56, MARK_SIZE - 56, 12, theme.accentSoft);

    ctx.font = '48px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽', MARK_SIZE / 2, MARK_SIZE / 2 + 2);

    return canvas.toBuffer('image/png');
}

async function renderBrandMark() {
    if (shouldUseSvgHelp()) {
        try {
            const adapters = require('../../dist/graphics/adapters');
            return await adapters.renderBrandMarkSvg();
        } catch {
            // fall through to canvas
        }
    }

    return renderBrandMarkCanvas();
}

/**
 * @param {string} pageId
 * @param {string} locale
 * @param {(key: string) => string} tr
 */
async function ensureHelpAssets(pageId, locale, tr) {
    fs.mkdirSync(ASSETS_ROOT, { recursive: true });
    fs.mkdirSync(path.join(ASSETS_ROOT, 'brand'), { recursive: true });
    fs.mkdirSync(path.join(ASSETS_ROOT, 'backgrounds'), { recursive: true });
    fs.mkdirSync(path.join(ASSETS_ROOT, 'overlays'), { recursive: true });

    const markPath = resolveAssetPath(ASSET_PATHS.brandMark);
    let markBuffer;

    if (fs.existsSync(markPath)) {
        markBuffer = fs.readFileSync(markPath);
    } else {
        const legacyMark = path.join(LEGACY_ASSETS_ROOT, 'golazo-mark.png');
        if (fs.existsSync(legacyMark)) {
            markBuffer = fs.readFileSync(legacyMark);
        } else {
            markBuffer = await renderBrandMark();
            fs.writeFileSync(markPath, markBuffer);
        }
    }

    const bannerBuffer = await renderHelpFooter(pageId, tr);

    return {
        bannerBuffer,
        markBuffer,
        bannerName: `help-banner-${pageId}.png`,
        markName: 'golazo-mark.png'
    };
}

/**
 * @param {string[]} locales
 * @param {(locale: string) => (key: string) => string} translatorFactory
 * @param {readonly string[]} pageIds
 */
async function regenerateAllHelpAssets(locales, translatorFactory, pageIds) {
    fs.mkdirSync(ASSETS_ROOT, { recursive: true });
    fs.mkdirSync(path.join(ASSETS_ROOT, 'brand'), { recursive: true });

    const markPath = resolveAssetPath(ASSET_PATHS.brandMark);
    if (!fs.existsSync(markPath)) {
        fs.writeFileSync(markPath, await renderBrandMark());
    }

    for (const locale of locales) {
        const tr = translatorFactory(locale);

        for (const pageId of pageIds) {
            const buffer = await renderHelpFooter(pageId, tr);
            const cacheDir = path.join(ASSETS_ROOT, 'cache', locale);
            fs.mkdirSync(cacheDir, { recursive: true });
            fs.writeFileSync(path.join(cacheDir, `${pageId}-footer.png`), buffer);
        }
    }
}

module.exports = {
    ensureHelpAssets,
    regenerateAllHelpAssets,
    renderHelpFooter,
    renderBrandMark,
    buildHelpBannerInput,
    ASSETS_ROOT,
    LEGACY_ASSETS_ROOT
};