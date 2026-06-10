"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatPill = StatPill;
exports.StatusPill = StatusPill;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const tokens_1 = require("../tokens");
function StatPill(props) {
    const hgt = 36;
    const y0 = props.y - hgt / 2;
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('rect', {
        x: props.x,
        y: y0,
        width: props.width,
        height: hgt,
        rx: tokens_1.radius.chip,
        fill: surfaces_1.surfaces.inset,
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
    }), (0, SvgBuilder_1.h)('text', {
        x: props.x + 10,
        y: y0 + 12,
        className: 'overline uppercase',
        fill: props.theme.textMuted,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('overline', props.label, props.width - 20)), (0, SvgBuilder_1.h)('text', {
        x: props.x + 10,
        y: y0 + 26,
        className: 'statLg tabular',
        fill: props.emphasize ? props.theme.textPrimary : props.theme.textSecondary,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('statLg', props.value, props.width - 20)));
}
function StatusPill(props) {
    const padX = 10;
    const hgt = 22;
    const textW = props.label.length * 6.5 + padX * 2;
    const pillW = Math.min(120, Math.max(44, textW));
    const pillX = props.align === 'right'
        ? props.x - pillW
        : props.align === 'center'
            ? props.x - pillW / 2
            : props.x;
    const pillY = props.y - hgt / 2;
    const fills = {
        accent: props.theme.accentSoft,
        muted: surfaces_1.surfaces.inset,
        live: 'rgba(34, 197, 94, 0.2)',
    };
    const textColors = {
        accent: props.theme.accent,
        muted: props.theme.textMuted,
        live: props.theme.accent,
    };
    const tone = props.tone ?? 'muted';
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('rect', {
        x: pillX,
        y: pillY,
        width: pillW,
        height: hgt,
        rx: tokens_1.radius.chip,
        fill: fills[tone],
        stroke: tone === 'live' ? props.theme.accent : surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
    }), (0, SvgBuilder_1.h)('text', {
        x: pillX + pillW / 2,
        y: props.y,
        className: 'chip uppercase',
        fill: textColors[tone],
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('chip', props.label, pillW - 8)));
}
//# sourceMappingURL=StatPill.js.map