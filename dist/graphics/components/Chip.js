"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chip = Chip;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const tokens_1 = require("../tokens");
function Chip(props) {
    const height = props.height ?? 24;
    const paddingX = 14;
    const maxWidth = props.maxWidth ?? 220;
    const label = (0, TextMeasurer_1.truncateText)('chip', props.label, maxWidth - paddingX * 2);
    const textWidth = label.length * 7;
    const chipWidth = Math.min(maxWidth, textWidth + paddingX * 2);
    const chipX = props.x - chipWidth;
    const chipY = props.y - height / 2;
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('rect', {
        x: chipX,
        y: chipY,
        width: chipWidth,
        height,
        rx: tokens_1.radius.chip,
        fill: props.fill ?? props.theme.accentSoft,
        stroke: props.theme.borderSubtle,
        'stroke-width': 1,
    }), (0, SvgBuilder_1.h)('text', {
        x: chipX + chipWidth / 2,
        y: props.y,
        className: 'chip',
        fill: props.textColor ?? props.theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, label));
}
//# sourceMappingURL=Chip.js.map