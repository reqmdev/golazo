"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportsCardHeader = SportsCardHeader;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const cardLayout_1 = require("../tokens/cardLayout");
const contentBlock_1 = require("../utils/contentBlock");
const CardIcon_1 = require("./CardIcon");
function SportsCardHeader(props) {
    const hgt = cardLayout_1.card.headerHeight;
    const iconSize = props.iconSize ?? contentBlock_1.cardHeaderIcon.size;
    const iconGap = Math.round(contentBlock_1.cardHeaderIcon.gap * (iconSize / contentBlock_1.cardHeaderIcon.size));
    const iconX = Math.round(contentBlock_1.cardHeaderIcon.opticalOffsetX * (iconSize / contentBlock_1.cardHeaderIcon.size));
    const iconOffsetY = Math.round(contentBlock_1.cardHeaderIcon.offsetY * (iconSize / contentBlock_1.cardHeaderIcon.size));
    const titleX = props.icon ? iconX + iconSize + iconGap : 0;
    const textWidth = props.width - 96 - titleX;
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, props.icon
        ? (0, CardIcon_1.CardIcon)({
            kind: props.icon,
            x: iconX,
            y: iconOffsetY,
            size: iconSize,
            stroke: props.theme.textMuted,
            strokeWidth: 1.7,
        })
        : null, (0, SvgBuilder_1.h)('text', {
        x: titleX,
        y: 20,
        className: 'title',
        fill: props.theme.textPrimary,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('title', props.title, textWidth)), props.subtitle
        ? (0, SvgBuilder_1.h)('text', {
            x: titleX,
            y: 40,
            className: 'caption',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.subtitle, textWidth))
        : null, props.meta
        ? (0, SvgBuilder_1.h)('text', {
            x: props.width,
            y: 20,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.meta, 100))
        : null, props.status
        ? (0, SvgBuilder_1.h)('text', {
            x: props.width,
            y: 40,
            className: 'chip',
            fill: props.theme.textSecondary,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('chip', props.status, 100))
        : null, props.showDivider !== false
        ? (0, SvgBuilder_1.h)('line', {
            x1: 0,
            y1: hgt,
            x2: props.width,
            y2: hgt,
            stroke: surfaces_1.surfaces.strokeSubtle,
            'stroke-width': 1,
            opacity: 0.45,
        })
        : null);
}
//# sourceMappingURL=SportsCardHeader.js.map