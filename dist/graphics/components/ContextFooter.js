"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextFooter = ContextFooter;
const SvgBuilder_1 = require("../core/SvgBuilder");
const surfaces_1 = require("../tokens/surfaces");
const TextMeasurer_1 = require("../typography/TextMeasurer");
function ContextFooter(props) {
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, (0, SvgBuilder_1.h)('line', {
        x1: 0,
        y1: 0,
        x2: props.width,
        y2: 0,
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.45,
    }), (0, SvgBuilder_1.h)('text', {
        x: 0,
        y: props.height / 2,
        className: 'caption',
        fill: props.theme.textMuted,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('caption', props.left, props.width - 80)), props.right
        ? (0, SvgBuilder_1.h)('text', {
            x: props.width,
            y: props.height / 2,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.right, 80))
        : null);
}
//# sourceMappingURL=ContextFooter.js.map