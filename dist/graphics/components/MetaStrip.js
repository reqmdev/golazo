"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaStrip = MetaStrip;
const SvgBuilder_1 = require("../core/SvgBuilder");
const surfaces_1 = require("../tokens/surfaces");
const cardLayout_1 = require("../tokens/cardLayout");
const TextMeasurer_1 = require("../typography/TextMeasurer");
function MetaStrip(props) {
    const midY = props.y + cardLayout_1.portrait.matchMetaHeight / 2;
    const line = props.cells
        .map((cell) => {
        const label = (0, TextMeasurer_1.truncateText)('overline', cell.label, 48);
        const value = (0, TextMeasurer_1.truncateText)('caption', cell.value, 32);
        return `${label} ${value}`;
    })
        .join('  ·  ');
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('line', {
        x1: props.x,
        y1: props.y,
        x2: props.x + props.width,
        y2: props.y,
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.35,
    }), (0, SvgBuilder_1.h)('text', {
        x: props.x + props.width / 2,
        y: midY,
        className: 'caption',
        fill: props.theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('caption', line, props.width - 16)));
}
//# sourceMappingURL=MetaStrip.js.map