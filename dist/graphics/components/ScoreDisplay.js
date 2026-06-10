"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreDisplay = ScoreDisplay;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TextMeasurer_1 = require("../typography/TextMeasurer");
function ScoreDisplay(props) {
    const homeActive = props.winner === 'home';
    const awayActive = props.winner === 'away';
    const gap = 36;
    const homeX = props.x - gap;
    const awayX = props.x + gap;
    const scoreClass = props.upcoming ? 'scoreMd' : 'scoreXl';
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('text', {
        x: homeX,
        y: props.y,
        className: `${scoreClass} tabular`,
        fill: homeActive ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
        opacity: props.upcoming ? 0.5 : homeActive ? 1 : 0.7,
    }, String(props.homeGoals)), (0, SvgBuilder_1.h)('text', {
        x: props.x,
        y: props.y,
        className: 'scoreMd tabular',
        fill: props.theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        opacity: 0.45,
    }, props.upcoming ? '–' : '–'), (0, SvgBuilder_1.h)('text', {
        x: awayX,
        y: props.y,
        className: `${scoreClass} tabular`,
        fill: awayActive ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'start',
        'dominant-baseline': 'middle',
        opacity: props.upcoming ? 0.5 : awayActive ? 1 : 0.7,
    }, String(props.awayGoals)), props.statusLabel
        ? (0, SvgBuilder_1.h)('text', {
            x: props.x,
            y: props.y + 26,
            className: 'chip',
            fill: props.theme.textMuted,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('chip', props.statusLabel, 80))
        : null);
}
//# sourceMappingURL=ScoreDisplay.js.map