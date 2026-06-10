"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompactAppBar = CompactAppBar;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const cardLayout_1 = require("../tokens/cardLayout");
function CompactAppBar(props) {
    const hgt = cardLayout_1.portrait.appBarHeight;
    const pad = 0;
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, (0, SvgBuilder_1.h)('text', {
        x: pad,
        y: 16,
        className: 'subtitle',
        fill: props.theme.textPrimary,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('subtitle', props.title, props.width - 120)), props.subtitle
        ? (0, SvgBuilder_1.h)('text', {
            x: pad,
            y: 32,
            className: 'caption',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.subtitle, props.width - 120))
        : null, props.meta
        ? (0, SvgBuilder_1.h)('text', {
            x: props.width,
            y: 16,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.meta, 80))
        : null, props.status
        ? (0, SvgBuilder_1.h)('text', {
            x: props.width,
            y: 32,
            className: 'chip uppercase',
            fill: props.theme.textSecondary,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('chip', props.status, 80))
        : null, (0, SvgBuilder_1.h)('line', {
        x1: 0,
        y1: hgt,
        x2: props.width,
        y2: hgt,
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.45,
    }));
}
//# sourceMappingURL=CompactAppBar.js.map