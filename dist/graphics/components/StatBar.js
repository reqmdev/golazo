"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalShareBar = GoalShareBar;
const SvgBuilder_1 = require("../core/SvgBuilder");
const surfaces_1 = require("../tokens/surfaces");
const tokens_1 = require("../tokens");
/** Goal-share bar derived from actual score data — not fabricated stats. */
function GoalShareBar(props) {
    const barH = 8;
    const total = props.homeGoals + props.awayGoals;
    const homePct = total > 0 ? props.homeGoals / total : 0.5;
    const homeW = Math.max(4, Math.round((props.width - 4) * homePct));
    const awayW = props.width - 4 - homeW;
    const trackY = props.y + 14;
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('text', {
        x: props.x,
        y: props.y,
        className: 'overline uppercase',
        fill: props.theme.textMuted,
        'dominant-baseline': 'middle',
    }, 'Goal share'), (0, SvgBuilder_1.h)('text', {
        x: props.x + props.width,
        y: props.y,
        className: 'stat tabular',
        fill: props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
    }, `${Math.round(homePct * 100)}% — ${Math.round((1 - homePct) * 100)}%`), (0, SvgBuilder_1.h)('rect', {
        x: props.x,
        y: trackY,
        width: props.width,
        height: barH,
        rx: tokens_1.radius.chip,
        fill: surfaces_1.surfaces.inset,
    }), (0, SvgBuilder_1.h)('rect', {
        x: props.x,
        y: trackY,
        width: homeW,
        height: barH,
        rx: tokens_1.radius.chip,
        fill: props.theme.accent,
    }), awayW > 0
        ? (0, SvgBuilder_1.h)('rect', {
            x: props.x + homeW,
            y: trackY,
            width: awayW,
            height: barH,
            rx: tokens_1.radius.chip,
            fill: props.theme.textMuted,
            opacity: 0.35,
        })
        : null, (0, SvgBuilder_1.h)('text', {
        x: props.x,
        y: trackY + barH + 14,
        className: 'caption',
        fill: props.theme.textSecondary,
        'dominant-baseline': 'middle',
    }, truncateLabel(props.homeLabel, 18)), (0, SvgBuilder_1.h)('text', {
        x: props.x + props.width,
        y: trackY + barH + 14,
        className: 'caption',
        fill: props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
    }, truncateLabel(props.awayLabel, 18)));
}
function truncateLabel(text, max) {
    if (text.length <= max)
        return text;
    return `${text.slice(0, max - 1)}…`;
}
//# sourceMappingURL=StatBar.js.map