"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradientIds = gradientIds;
exports.CardGradientDefs = CardGradientDefs;
const SvgBuilder_1 = require("../core/SvgBuilder");
const GRADIENT_UID = 'gz';
function gradientIds() {
    return {
        canvas: `${GRADIENT_UID}-canvas`,
        body: `${GRADIENT_UID}-body`,
        accent: `${GRADIENT_UID}-accent`,
        icon: `${GRADIENT_UID}-icon`,
        chip: `${GRADIENT_UID}-chip`,
    };
}
function CardGradientDefs(theme) {
    const ids = gradientIds();
    return (0, SvgBuilder_1.h)('defs', (0, SvgBuilder_1.h)('linearGradient', { id: ids.canvas, x1: '0', y1: '0', x2: '0', y2: '1' }, (0, SvgBuilder_1.h)('stop', { offset: '0%', 'stop-color': '#10141c' }), (0, SvgBuilder_1.h)('stop', { offset: '55%', 'stop-color': '#0b0d12' }), (0, SvgBuilder_1.h)('stop', { offset: '100%', 'stop-color': '#07080a' })), (0, SvgBuilder_1.h)('linearGradient', { id: ids.body, x1: '0', y1: '0', x2: '1', y2: '1' }, (0, SvgBuilder_1.h)('stop', { offset: '0%', 'stop-color': '#1a2030', stopOpacity: 0.72 }), (0, SvgBuilder_1.h)('stop', { offset: '100%', 'stop-color': '#12151f', stopOpacity: 0.42 })), (0, SvgBuilder_1.h)('linearGradient', { id: ids.accent, x1: '0', y1: '0', x2: '0', y2: '1' }, (0, SvgBuilder_1.h)('stop', { offset: '0%', 'stop-color': theme.accent }), (0, SvgBuilder_1.h)('stop', { offset: '100%', 'stop-color': '#15803d' })), (0, SvgBuilder_1.h)('linearGradient', { id: ids.icon, x1: '0', y1: '0', x2: '1', y2: '1' }, (0, SvgBuilder_1.h)('stop', { offset: '0%', 'stop-color': 'rgba(34,197,94,0.28)' }), (0, SvgBuilder_1.h)('stop', { offset: '100%', 'stop-color': 'rgba(34,197,94,0.08)' })), (0, SvgBuilder_1.h)('linearGradient', { id: ids.chip, x1: '0', y1: '0', x2: '1', y2: '0' }, (0, SvgBuilder_1.h)('stop', { offset: '0%', 'stop-color': 'rgba(255,255,255,0.06)' }), (0, SvgBuilder_1.h)('stop', { offset: '100%', 'stop-color': 'rgba(255,255,255,0.02)' })));
}
//# sourceMappingURL=CardGradients.js.map