"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamLogo = TeamLogo;
const SvgBuilder_1 = require("../core/SvgBuilder");
const dataUri_1 = require("../utils/dataUri");
const colors_1 = require("../utils/colors");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const tokens_1 = require("../tokens");
function TeamLogo(props) {
    const r = tokens_1.radius.logo;
    const inner = props.size;
    const children = [];
    if (props.logoBuffer) {
        children.push((0, SvgBuilder_1.h)('defs', (0, SvgBuilder_1.h)('clipPath', { id: props.clipId }, (0, SvgBuilder_1.h)('rect', {
            x: props.x,
            y: props.y,
            width: inner,
            height: inner,
            rx: r,
        }))), (0, SvgBuilder_1.h)('image', {
            x: props.x,
            y: props.y,
            width: inner,
            height: inner,
            href: (0, dataUri_1.bufferToDataUri)(props.logoBuffer),
            'clip-path': `url(#${props.clipId})`,
            preserveAspectRatio: 'xMidYMid slice',
        }), (0, SvgBuilder_1.h)('rect', {
            x: props.x - 1,
            y: props.y - 1,
            width: inner + 2,
            height: inner + 2,
            rx: r + 1,
            fill: 'none',
            stroke: 'rgba(255,255,255,0.14)',
            'stroke-width': 1,
        }));
    }
    else {
        const color = props.team.color || '#2a2f38';
        children.push((0, SvgBuilder_1.h)('rect', {
            x: props.x,
            y: props.y,
            width: inner,
            height: inner,
            rx: r,
            fill: color,
        }), (0, SvgBuilder_1.h)('text', {
            x: props.x + props.size / 2,
            y: props.y + props.size / 2 + 1,
            className: 'caption',
            fill: (0, colors_1.contrastText)(color),
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.teamInitials)(props.team.name)));
    }
    return (0, SvgBuilder_1.h)('g', children);
}
//# sourceMappingURL=TeamLogo.js.map