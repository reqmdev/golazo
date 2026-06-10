import { h } from '../core/SvgBuilder';
import { truncateText } from '../typography/TextMeasurer';
import type { Theme } from '../core/types';

export function FooterText(props: {
  x: number;
  y: number;
  width: number;
  text: string;
  theme: Theme;
}) {
  return h(
    'text',
    {
      x: props.x + props.width / 2,
      y: props.y,
      className: 'caption',
      fill: props.theme.textMuted,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
    },
    truncateText('caption', props.text, props.width),
  );
}

export function Watermark(props: {
  x: number;
  y: number;
  width: number;
  text: string;
  theme: Theme;
}) {
  return h(
    'text',
    {
      x: props.x + props.width,
      y: props.y,
      className: 'watermark',
      fill: `${props.theme.textMuted}66`,
      'text-anchor': 'end',
      'dominant-baseline': 'auto',
    },
    props.text,
  );
}