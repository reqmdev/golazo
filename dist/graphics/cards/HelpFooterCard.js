"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHelpFooterCard = renderHelpFooterCard;
exports.renderBrandMarkCard = renderBrandMarkCard;
exports.renderHelpFooterResult = renderHelpFooterResult;
const SvgBuilder_1 = require("../core/SvgBuilder");
const RenderPipeline_1 = require("../core/RenderPipeline");
const layout_1 = require("../tokens/layout");
function helpStripDefs(accent) {
    return (0, SvgBuilder_1.h)('defs', (0, SvgBuilder_1.h)('linearGradient', { id: 'help-strip-fade', x1: '0', y1: '0', x2: '0', y2: '1' }, (0, SvgBuilder_1.h)('stop', { offset: '0%', 'stop-color': '#08090a', stopOpacity: 0.55 }), (0, SvgBuilder_1.h)('stop', { offset: '100%', 'stop-color': '#08090a', stopOpacity: 0.92 })), (0, SvgBuilder_1.h)('linearGradient', { id: 'help-strip-accent', x1: '0', y1: '0', x2: '1', y2: '0' }, (0, SvgBuilder_1.h)('stop', { offset: '0%', 'stop-color': accent, stopOpacity: 0 }), (0, SvgBuilder_1.h)('stop', { offset: '35%', 'stop-color': accent, stopOpacity: 0.85 }), (0, SvgBuilder_1.h)('stop', { offset: '100%', 'stop-color': accent, stopOpacity: 0.35 })));
}
async function renderHelpFooterCard(input, theme) {
    const accentY = layout_1.HELP_FOOTER_HEIGHT - 5;
    const document = new SvgBuilder_1.SvgDocument(layout_1.CANVAS_WIDTH, layout_1.HELP_FOOTER_HEIGHT, [
        helpStripDefs(input.accent),
        (0, SvgBuilder_1.h)('rect', {
            x: 0,
            y: 0,
            width: layout_1.CANVAS_WIDTH,
            height: layout_1.HELP_FOOTER_HEIGHT,
            fill: theme.canvas,
        }),
        (0, SvgBuilder_1.h)('rect', {
            x: 0,
            y: 0,
            width: layout_1.CANVAS_WIDTH,
            height: layout_1.HELP_FOOTER_HEIGHT,
            fill: 'url(#help-strip-fade)',
        }),
        (0, SvgBuilder_1.h)('text', {
            x: 36,
            y: layout_1.HELP_FOOTER_HEIGHT / 2 - 6,
            className: 'subtitle',
            fill: theme.textPrimary,
            'dominant-baseline': 'middle',
        }, input.heroTitle),
        input.heroSubtitle
            ? (0, SvgBuilder_1.h)('text', {
                x: 36,
                y: layout_1.HELP_FOOTER_HEIGHT / 2 + 16,
                className: 'caption',
                fill: theme.textMuted,
                'dominant-baseline': 'middle',
            }, input.heroSubtitle)
            : null,
        (0, SvgBuilder_1.h)('text', {
            x: layout_1.CANVAS_WIDTH - 36,
            y: layout_1.HELP_FOOTER_HEIGHT / 2,
            className: 'overline uppercase',
            fill: theme.textSecondary,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
            'letter-spacing': '0.12em',
        }, input.brandLabel),
        (0, SvgBuilder_1.h)('rect', {
            x: 0,
            y: accentY,
            width: layout_1.CANVAS_WIDTH,
            height: 5,
            fill: 'url(#help-strip-accent)',
        }),
    ], theme.canvas);
    return (0, RenderPipeline_1.renderCard)(document, {
        width: layout_1.CANVAS_WIDTH,
        height: layout_1.HELP_FOOTER_HEIGHT,
        theme,
        backgroundVariant: 'data',
        scale: 1,
    });
}
async function renderBrandMarkCard(theme) {
    const size = 128;
    const document = new SvgBuilder_1.SvgDocument(size, size, [
        (0, SvgBuilder_1.h)('rect', {
            x: 8,
            y: 8,
            width: size - 16,
            height: size - 16,
            rx: 20,
            fill: theme.surfaceRaised,
            stroke: theme.border,
            'stroke-width': 1,
        }),
        (0, SvgBuilder_1.h)('rect', {
            x: 28,
            y: 28,
            width: size - 56,
            height: size - 56,
            rx: 12,
            fill: theme.accentSoft,
        }),
        (0, SvgBuilder_1.h)('text', {
            x: size / 2,
            y: size / 2 + 2,
            fontSize: 48,
            fill: theme.accent,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
        }, '⚽'),
    ], theme.canvas);
    return (0, RenderPipeline_1.renderCard)(document, {
        width: size,
        height: size,
        theme,
        scale: 1,
    });
}
async function renderHelpFooterResult(input, theme) {
    const buffer = await renderHelpFooterCard(input, theme);
    return {
        buffer,
        filename: `help-banner-${input.pageId}.png`,
    };
}
//# sourceMappingURL=HelpFooterCard.js.map