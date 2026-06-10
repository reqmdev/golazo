import { h } from '../core/SvgBuilder';
import { surfaces } from '../tokens/surfaces';
import { card } from '../tokens/cardLayout';

/** Single subtle content band — not a nested card. */
export function SportsCardBody(props: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  if (props.height <= 0) {
    return h('g');
  }

  return h('rect', {
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    rx: card.radius,
    fill: surfaces.overlay,
    opacity: 0.5,
  });
}