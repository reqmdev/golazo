import { h } from '../core/SvgBuilder';
import { truncateText } from '../typography/TextMeasurer';
import { surfaces } from '../tokens/surfaces';
import { card } from '../tokens/cardLayout';
import type { Theme } from '../core/types';

export function SportsCardFooter(props: {
  x: number;
  y: number;
  width: number;
  left?: string;
  center?: string;
  right?: string;
  /** Push right label lower (e.g. Golazo watermark). */
  rightSink?: number;
  /** Show hairline above footer (default true). */
  showDivider?: boolean;
  theme: Theme;
}) {
  const hgt = card.footerHeight;
  const rightY = hgt / 2 + (props.rightSink ?? 0);

  return h(
    'g',
    { transform: `translate(${props.x},${props.y})` },
    props.showDivider !== false
      ? h('line', {
          x1: 0,
          y1: 0,
          x2: props.width,
          y2: 0,
          stroke: surfaces.strokeSubtle,
          'stroke-width': 1,
          opacity: 0.45,
        })
      : null,
    props.left
      ? h(
          'text',
          {
            x: 0,
            y: hgt / 2,
            className: 'caption',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
          },
          truncateText('caption', props.left, props.width / 3),
        )
      : null,
    props.center
      ? h(
          'text',
          {
            x: props.width / 2,
            y: hgt / 2,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
          },
          truncateText('caption', props.center, props.width / 2),
        )
      : null,
    props.right
      ? h(
          'text',
          {
            x: props.width,
            y: rightY,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
          },
          truncateText('caption', props.right, props.width / 3),
        )
      : null,
  );
}