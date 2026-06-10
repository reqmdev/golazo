"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
const SvgBuilder_1 = require("../core/SvgBuilder");
const tokens_1 = require("../tokens");
function Card(props) {
    const { x, y, width, height, theme, children } = props;
    const childNodes = Array.isArray(children) ? children : children !== undefined ? [children] : [];
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${x},${y})` }, (0, SvgBuilder_1.h)('rect', {
        width,
        height,
        rx: tokens_1.radius.card,
        fill: theme.surfaceRaised,
        stroke: theme.border,
        'stroke-width': 1,
    }), ...childNodes);
}
//# sourceMappingURL=Card.js.map