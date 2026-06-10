"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Surface = Surface;
const SvgBuilder_1 = require("../core/SvgBuilder");
const surfaces_1 = require("../tokens/surfaces");
const tokens_1 = require("../tokens");
const FILLS = {
    raised: surfaces_1.surfaces.raised,
    inset: surfaces_1.surfaces.inset,
    overlay: surfaces_1.surfaces.overlay,
    transparent: 'transparent',
};
function Surface(props) {
    const variant = props.variant ?? 'raised';
    const rx = props.rx ?? tokens_1.radius.card;
    const childNodes = Array.isArray(props.children)
        ? props.children
        : props.children !== undefined
            ? [props.children]
            : [];
    const nodes = [
        (0, SvgBuilder_1.h)('rect', {
            x: props.x,
            y: props.y,
            width: props.width,
            height: props.height,
            rx,
            fill: FILLS[variant],
            stroke: surfaces_1.surfaces.stroke,
            'stroke-width': surfaces_1.depth.borderWidth,
        }),
    ];
    if (variant === 'raised') {
        nodes.push((0, SvgBuilder_1.h)('rect', {
            x: props.x + 1,
            y: props.y + 1,
            width: props.width - 2,
            height: 1,
            fill: surfaces_1.depth.insetHighlight,
            opacity: 0.6,
        }));
    }
    if (props.accentBar) {
        nodes.push((0, SvgBuilder_1.h)('rect', {
            x: props.x,
            y: props.y + 8,
            width: surfaces_1.depth.accentBarWidth,
            height: props.height - 16,
            rx: 1,
            fill: props.theme.accent,
        }));
    }
    nodes.push((0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, ...childNodes));
    return (0, SvgBuilder_1.h)('g', nodes);
}
//# sourceMappingURL=Surface.js.map