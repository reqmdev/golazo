import { h, SvgChild } from '../core/SvgBuilder';
import { radius } from '../tokens';
import type { Theme } from '../core/types';

export function Card(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  theme: Theme;
  children?: SvgChild | SvgChild[];
}) {
  const { x, y, width, height, theme, children } = props;
  const childNodes = Array.isArray(children) ? children : children !== undefined ? [children] : [];

  return h(
    'g',
    { transform: `translate(${x},${y})` },
    h('rect', {
      width,
      height,
      rx: radius.card,
      fill: theme.surfaceRaised,
      stroke: theme.border,
      'stroke-width': 1,
    }),
    ...childNodes,
  );
}