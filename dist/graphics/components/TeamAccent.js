"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamColorWash = TeamColorWash;
const SvgBuilder_1 = require("../core/SvgBuilder");
const colors_1 = require("../utils/colors");
function TeamColorWash(props) {
    if (!props.color)
        return null;
    const fill = (0, colors_1.hexWithAlpha)(props.color, 0.05);
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('defs', (0, SvgBuilder_1.h)('linearGradient', {
        id: `wash-${props.align}-${props.x}-${props.y}`,
        x1: '0',
        y1: props.align === 'top' ? '0' : '1',
        x2: '0',
        y2: props.align === 'top' ? '1' : '0',
    }, (0, SvgBuilder_1.h)('stop', { offset: '0%', 'stop-color': fill }), (0, SvgBuilder_1.h)('stop', { offset: '70%', 'stop-color': fill, 'stop-opacity': 0 }))), (0, SvgBuilder_1.h)('rect', {
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        fill: `url(#wash-${props.align}-${props.x}-${props.y})`,
    }));
}
//# sourceMappingURL=TeamAccent.js.map