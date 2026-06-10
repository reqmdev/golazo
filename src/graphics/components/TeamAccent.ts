import { h } from '../core/SvgBuilder';
import { hexWithAlpha } from '../utils/colors';

export function TeamColorWash(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string | null;
  align: 'top' | 'bottom';
}) {
  if (!props.color) return null;

  const fill = hexWithAlpha(props.color, 0.05);

  return h(
    'g',
    h('defs', h(
      'linearGradient',
      {
        id: `wash-${props.align}-${props.x}-${props.y}`,
        x1: '0',
        y1: props.align === 'top' ? '0' : '1',
        x2: '0',
        y2: props.align === 'top' ? '1' : '0',
      },
      h('stop', { offset: '0%', 'stop-color': fill }),
      h('stop', { offset: '70%', 'stop-color': fill, 'stop-opacity': 0 }),
    )),
    h('rect', {
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height,
      fill: `url(#wash-${props.align}-${props.x}-${props.y})`,
    }),
  );
}