"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportsCardFooter = SportsCardFooter;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const cardLayout_1 = require("../tokens/cardLayout");
function SportsCardFooter(props) {
    const hgt = cardLayout_1.card.footerHeight;
    const rightY = hgt / 2 + (props.rightSink ?? 0);
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, props.showDivider !== false
        ? (0, SvgBuilder_1.h)('line', {
            x1: 0,
            y1: 0,
            x2: props.width,
            y2: 0,
            stroke: surfaces_1.surfaces.strokeSubtle,
            'stroke-width': 1,
            opacity: 0.45,
        })
        : null, props.left
        ? (0, SvgBuilder_1.h)('text', {
            x: 0,
            y: hgt / 2,
            className: 'caption',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.left, props.width / 3))
        : null, props.center
        ? (0, SvgBuilder_1.h)('text', {
            x: props.width / 2,
            y: hgt / 2,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.center, props.width / 2))
        : null, props.right
        ? (0, SvgBuilder_1.h)('text', {
            x: props.width,
            y: rightY,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.right, props.width / 3))
        : null);
}
//# sourceMappingURL=SportsCardFooter.js.map