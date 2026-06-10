"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardFrame = CardFrame;
const SvgBuilder_1 = require("../core/SvgBuilder");
const surfaces_1 = require("../tokens/surfaces");
const cardLayout_1 = require("../tokens/cardLayout");
/** Flat card shell — no decorative chrome. */
function CardFrame(props) {
    const rx = cardLayout_1.card.radius;
    const childNodes = Array.isArray(props.children) ? props.children : [props.children];
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('rect', {
        x: 0,
        y: 0,
        width: props.width,
        height: props.height,
        rx,
        fill: surfaces_1.surfaces.canvas,
    }), ...childNodes);
}
//# sourceMappingURL=CardFrame.js.map