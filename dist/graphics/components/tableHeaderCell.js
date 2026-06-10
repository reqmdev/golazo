"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.headerIconPad = headerIconPad;
exports.resolveHeaderCellLayout = resolveHeaderCellLayout;
const TextMeasurer_1 = require("../typography/TextMeasurer");
const contentBlock_1 = require("../utils/contentBlock");
const DEFAULT_HEADER_ICON_SIZE = 11;
const DEFAULT_HEADER_ICON_GAP = 4;
function headerIconPad(iconKind, iconSize = DEFAULT_HEADER_ICON_SIZE) {
    const gap = Math.round(DEFAULT_HEADER_ICON_GAP * (iconSize / DEFAULT_HEADER_ICON_SIZE));
    return iconKind ? iconSize + gap : 0;
}
/**
 * Place column header icon + label; icon always leads, group centered when needed.
 */
function resolveHeaderCellLayout(offset, column, iconKind, headerIconSize = DEFAULT_HEADER_ICON_SIZE) {
    const iconPad = headerIconPad(iconKind, headerIconSize);
    const iconOpticalX = iconKind ? (0, contentBlock_1.cardIconOpticalOffsetX)(headerIconSize) : 0;
    const label = column.label.toUpperCase();
    const labelWidth = (0, TextMeasurer_1.measureText)('overline', label);
    const groupWidth = iconPad + labelWidth;
    if (column.align === 'center') {
        const groupStart = offset + Math.max(0, (column.width - groupWidth) / 2);
        return {
            iconX: groupStart + iconOpticalX,
            textX: groupStart + iconOpticalX + iconPad,
            textAnchor: 'start',
            iconSize: headerIconSize,
        };
    }
    if (column.align === 'right') {
        const groupEnd = offset + column.width - 4;
        return {
            iconX: groupEnd - groupWidth + iconOpticalX,
            textX: groupEnd - labelWidth + iconOpticalX,
            textAnchor: 'start',
            iconSize: headerIconSize,
        };
    }
    const groupStart = offset + (column.type === 'team' ? 0 : 4);
    return {
        iconX: groupStart + iconOpticalX,
        textX: groupStart + iconOpticalX + iconPad,
        textAnchor: 'start',
        iconSize: headerIconSize,
    };
}
//# sourceMappingURL=tableHeaderCell.js.map