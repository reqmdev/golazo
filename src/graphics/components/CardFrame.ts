import { h, SvgChild } from '../core/SvgBuilder';
import { surfaces } from '../tokens/surfaces';
import { card } from '../tokens/cardLayout';
import type { Theme } from '../core/types';

/** Flat card shell — no decorative chrome. */
export function CardFrame(props: {
  width: number;
  height: number;
  theme: Theme;
  children: SvgChild | SvgChild[];
}) {
  const rx = card.radius;
  const childNodes = Array.isArray(props.children) ? props.children : [props.children];

  return h(
    'g',
    h('rect', {
      x: 0,
      y: 0,
      width: props.width,
      height: props.height,
      rx,
      fill: surfaces.canvas,
    }),
    ...childNodes,
  );
}