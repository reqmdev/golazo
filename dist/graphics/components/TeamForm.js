"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamForm = TeamForm;
const SvgBuilder_1 = require("../core/SvgBuilder");
const FORM_COLORS = {
    W: (theme) => theme.win,
    D: (theme) => theme.draw,
    L: (theme) => theme.loss,
};
function TeamForm(props) {
    const dotSize = props.dotSize ?? 14;
    const gap = props.gap ?? 4;
    const items = props.form.slice(-5);
    const radius = dotSize / 2;
    const cy = props.centerY ?? (props.y ?? 0) + radius;
    const dots = [];
    for (let i = 0; i < 5; i += 1) {
        const letter = items[i];
        const hasResult = Boolean(letter && FORM_COLORS[letter]);
        const fill = hasResult ? FORM_COLORS[letter](props.theme) : 'rgba(255,255,255,0.06)';
        const dx = props.x + i * (dotSize + gap);
        dots.push((0, SvgBuilder_1.h)('circle', {
            cx: dx + radius,
            cy,
            r: radius,
            fill,
            stroke: hasResult ? 'none' : 'rgba(255,255,255,0.12)',
            'stroke-width': hasResult ? 0 : 1,
        }));
    }
    return (0, SvgBuilder_1.h)('g', dots);
}
//# sourceMappingURL=TeamForm.js.map