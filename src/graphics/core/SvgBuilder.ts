import { escapeXml } from '../utils/escape';
import { buildTypographyCss } from '../typography/styles';
import { getFontRegistry } from './FontRegistry';

export type SvgAttrs = Record<string, string | number | undefined | null | boolean>;
export type SvgChild = SvgNode | string | number | null | undefined | false;

export interface SvgNode {
  tag: string;
  attrs: SvgAttrs;
  children: SvgChild[];
}

const VOID_TAGS = new Set(['image', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'ellipse']);

function normalizeChildren(input: SvgChild | SvgChild[]): SvgChild[] {
  if (Array.isArray(input)) return input;
  if (input === undefined || input === null || input === false) return [];
  return [input];
}

export function h(
  tag: string,
  attrs?: SvgAttrs | SvgChild | SvgChild[],
  ...children: SvgChild[]
): SvgNode {
  if (attrs === undefined || attrs === null || typeof attrs === 'string' || typeof attrs === 'number' || Array.isArray(attrs) || isSvgNode(attrs)) {
    const merged = normalizeChildren(attrs as SvgChild | SvgChild[]).concat(children);
    return { tag, attrs: {}, children: merged };
  }

  return { tag, attrs: attrs as SvgAttrs, children };
}

function isSvgNode(value: unknown): value is SvgNode {
  return Boolean(value && typeof value === 'object' && 'tag' in (value as object));
}

function serializeAttrs(attrs: SvgAttrs): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'className') {
      parts.push(`class="${escapeXml(String(value))}"`);
      continue;
    }
    parts.push(`${key}="${escapeXml(String(value))}"`);
  }

  return parts.length ? ` ${parts.join(' ')}` : '';
}

function serializeNode(node: SvgChild): string {
  if (node === undefined || node === null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return escapeXml(String(node));

  const attrs = serializeAttrs(node.attrs);
  const inner = node.children.map(serializeNode).join('');

  if (VOID_TAGS.has(node.tag) && !inner) {
    return `<${node.tag}${attrs}/>`;
  }

  return `<${node.tag}${attrs}>${inner}</${node.tag}>`;
}

export class SvgDocument {
  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly children: SvgChild[],
    private readonly background = '#08090a',
  ) {}

  serialize(): string {
    const body = this.children.map(serializeNode).join('');
    const css = getFontRegistry().buildFontFaceCss() + buildTypographyCss();

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">`,
      '<defs><style><![CDATA[',
      css,
      ']]></style></defs>',
      `<rect width="100%" height="100%" fill="${escapeXml(this.background)}"/>`,
      body,
      '</svg>',
    ].join('');
  }
}