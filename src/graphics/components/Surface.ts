import { h, SvgChild } from '../core/SvgBuilder';
import { surfaces, depth } from '../tokens/surfaces';
import { radius } from '../tokens';
import type { Theme } from '../core/types';

export type SurfaceVariant = 'raised' | 'inset' | 'overlay' | 'transparent';

const FILLS: Record<SurfaceVariant, string> = {
  raised: surfaces.raised,
  inset: surfaces.inset,
  overlay: surfaces.overlay,
  transparent: 'transparent',
};

export function Surface(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  theme: Theme;
  variant?: SurfaceVariant;
  rx?: number;
  accentBar?: boolean;
  children?: SvgChild | SvgChild[];
}) {
  const variant = props.variant ?? 'raised';
  const rx = props.rx ?? radius.card;
  const childNodes = Array.isArray(props.children)
    ? props.children
    : props.children !== undefined
      ? [props.children]
      : [];

  const nodes: SvgChild[] = [
    h('rect', {
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height,
      rx,
      fill: FILLS[variant],
      stroke: surfaces.stroke,
      'stroke-width': depth.borderWidth,
    }),
  ];

  if (variant === 'raised') {
    nodes.push(
      h('rect', {
        x: props.x + 1,
        y: props.y + 1,
        width: props.width - 2,
        height: 1,
        fill: depth.insetHighlight,
        opacity: 0.6,
      }),
    );
  }

  if (props.accentBar) {
    nodes.push(
      h('rect', {
        x: props.x,
        y: props.y + 8,
        width: depth.accentBarWidth,
        height: props.height - 16,
        rx: 1,
        fill: props.theme.accent,
      }),
    );
  }

  nodes.push(h('g', { transform: `translate(${props.x},${props.y})` }, ...childNodes));

  return h('g', nodes);
}