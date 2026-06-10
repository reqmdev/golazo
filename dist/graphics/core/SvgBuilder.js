"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDocument = void 0;
exports.h = h;
const escape_1 = require("../utils/escape");
const styles_1 = require("../typography/styles");
const FontRegistry_1 = require("./FontRegistry");
const VOID_TAGS = new Set(['image', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'ellipse']);
function normalizeChildren(input) {
    if (Array.isArray(input))
        return input;
    if (input === undefined || input === null || input === false)
        return [];
    return [input];
}
function h(tag, attrs, ...children) {
    if (attrs === undefined || attrs === null || typeof attrs === 'string' || typeof attrs === 'number' || Array.isArray(attrs) || isSvgNode(attrs)) {
        const merged = normalizeChildren(attrs).concat(children);
        return { tag, attrs: {}, children: merged };
    }
    return { tag, attrs: attrs, children };
}
function isSvgNode(value) {
    return Boolean(value && typeof value === 'object' && 'tag' in value);
}
function serializeAttrs(attrs) {
    const parts = [];
    for (const [key, value] of Object.entries(attrs)) {
        if (value === undefined || value === null || value === false)
            continue;
        if (key === 'className') {
            parts.push(`class="${(0, escape_1.escapeXml)(String(value))}"`);
            continue;
        }
        parts.push(`${key}="${(0, escape_1.escapeXml)(String(value))}"`);
    }
    return parts.length ? ` ${parts.join(' ')}` : '';
}
function serializeNode(node) {
    if (node === undefined || node === null || node === false)
        return '';
    if (typeof node === 'string' || typeof node === 'number')
        return (0, escape_1.escapeXml)(String(node));
    const attrs = serializeAttrs(node.attrs);
    const inner = node.children.map(serializeNode).join('');
    if (VOID_TAGS.has(node.tag) && !inner) {
        return `<${node.tag}${attrs}/>`;
    }
    return `<${node.tag}${attrs}>${inner}</${node.tag}>`;
}
class SvgDocument {
    width;
    height;
    children;
    background;
    constructor(width, height, children, background = '#08090a') {
        this.width = width;
        this.height = height;
        this.children = children;
        this.background = background;
    }
    serialize() {
        const body = this.children.map(serializeNode).join('');
        const css = (0, FontRegistry_1.getFontRegistry)().buildFontFaceCss() + (0, styles_1.buildTypographyCss)();
        return [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">`,
            '<defs><style><![CDATA[',
            css,
            ']]></style></defs>',
            `<rect width="100%" height="100%" fill="${(0, escape_1.escapeXml)(this.background)}"/>`,
            body,
            '</svg>',
        ].join('');
    }
}
exports.SvgDocument = SvgDocument;
//# sourceMappingURL=SvgBuilder.js.map