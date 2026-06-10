"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportsCardBody = SportsCardBody;
const SvgBuilder_1 = require("../core/SvgBuilder");
const surfaces_1 = require("../tokens/surfaces");
const cardLayout_1 = require("../tokens/cardLayout");
/** Single subtle content band — not a nested card. */
function SportsCardBody(props) {
    if (props.height <= 0) {
        return (0, SvgBuilder_1.h)('g');
    }
    return (0, SvgBuilder_1.h)('rect', {
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        rx: cardLayout_1.card.radius,
        fill: surfaces_1.surfaces.overlay,
        opacity: 0.5,
    });
}
//# sourceMappingURL=SportsCardBody.js.map