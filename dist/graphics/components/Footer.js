"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooterText = FooterText;
exports.Watermark = Watermark;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TextMeasurer_1 = require("../typography/TextMeasurer");
function FooterText(props) {
    return (0, SvgBuilder_1.h)('text', {
        x: props.x + props.width / 2,
        y: props.y,
        className: 'caption',
        fill: props.theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('caption', props.text, props.width));
}
function Watermark(props) {
    return (0, SvgBuilder_1.h)('text', {
        x: props.x + props.width,
        y: props.y,
        className: 'watermark',
        fill: `${props.theme.textMuted}66`,
        'text-anchor': 'end',
        'dominant-baseline': 'auto',
    }, props.text);
}
//# sourceMappingURL=Footer.js.map