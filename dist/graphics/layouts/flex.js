"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.row = row;
exports.column = column;
exports.pad = pad;
exports.centerX = centerX;
exports.centerY = centerY;
function row(bounds, gap, count, index) {
    const itemWidth = (bounds.width - gap * (count - 1)) / count;
    return {
        x: bounds.x + index * (itemWidth + gap),
        y: bounds.y,
        width: itemWidth,
        height: bounds.height,
    };
}
function column(bounds, gap, count, index) {
    const itemHeight = (bounds.height - gap * (count - 1)) / count;
    return {
        x: bounds.x,
        y: bounds.y + index * (itemHeight + gap),
        width: bounds.width,
        height: itemHeight,
    };
}
function pad(bounds, padding) {
    return {
        x: bounds.x + padding,
        y: bounds.y + padding,
        width: bounds.width - padding * 2,
        height: bounds.height - padding * 2,
    };
}
function centerX(bounds) {
    return bounds.x + bounds.width / 2;
}
function centerY(bounds) {
    return bounds.y + bounds.height / 2;
}
//# sourceMappingURL=flex.js.map