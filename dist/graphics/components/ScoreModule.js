"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreModule = ScoreModule;
const SvgBuilder_1 = require("../core/SvgBuilder");
const StatPill_1 = require("./StatPill");
const surfaces_1 = require("../tokens/surfaces");
const tokens_1 = require("../tokens");
function ScoreModule(props) {
    const w = tokens_1.layout.scoreBoxWidth;
    const hgt = tokens_1.layout.scoreBoxHeight;
    const x = props.centerX - w / 2;
    const y = props.centerY - hgt / 2;
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('rect', {
        x,
        y,
        width: w,
        height: hgt,
        rx: tokens_1.radius.card,
        fill: surfaces_1.surfaces.inset,
        stroke: props.highlight ? props.theme.accent : surfaces_1.surfaces.stroke,
        'stroke-width': props.highlight ? 1.5 : 1,
    }), (0, SvgBuilder_1.h)('rect', {
        x: x + 1,
        y: y + 1,
        width: w - 2,
        height: 1,
        fill: 'rgba(255,255,255,0.05)',
    }), (0, SvgBuilder_1.h)('text', {
        x: props.centerX,
        y: props.centerY - 6,
        className: 'scoreXl tabular',
        fill: props.theme.textPrimary,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, props.scoreText), (0, StatPill_1.StatusPill)({
        x: props.centerX,
        y: props.centerY + 28,
        label: props.statusLabel,
        theme: props.theme,
        align: 'center',
        tone: props.statusLabel === 'FT' || props.statusLabel.includes('WO') ? 'muted' : 'live',
    }));
}
//# sourceMappingURL=ScoreModule.js.map