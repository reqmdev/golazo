"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRow = TeamRow;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TeamLogo_1 = require("./TeamLogo");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const layout_1 = require("../tokens/layout");
function TeamRow(props) {
    const logoSize = props.logoSize ?? layout_1.layout.logoSize;
    const logoGap = props.logoGap ?? 10;
    const nameClass = props.nameClass ?? 'bodySm';
    const midY = props.y + props.height / 2;
    const logoY = midY - logoSize / 2;
    const textX = props.x + logoSize + logoGap;
    const textWidth = props.width - (logoSize + logoGap + 4);
    const shortName = props.team.shortName?.trim();
    const children = [
        (0, TeamLogo_1.TeamLogo)({
            x: props.x,
            y: logoY,
            size: logoSize,
            logoBuffer: props.logoBuffer,
            team: props.team,
            clipId: `logo-${props.team.id}-${props.x}-${props.y}`,
        }),
        (0, SvgBuilder_1.h)('text', {
            x: textX,
            y: shortName ? midY - 9 : midY,
            className: nameClass,
            fill: props.theme.textPrimary,
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)(nameClass, props.team.name, shortName ? textWidth - 44 : textWidth)),
    ];
    if (shortName) {
        children.push((0, SvgBuilder_1.h)('text', {
            x: textX,
            y: midY + 11,
            className: 'caption',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', shortName, 40)));
    }
    return (0, SvgBuilder_1.h)('g', children);
}
//# sourceMappingURL=TeamRow.js.map