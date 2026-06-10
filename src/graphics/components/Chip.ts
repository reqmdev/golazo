import { h } from '../core/SvgBuilder';
import { truncateText } from '../typography/TextMeasurer';
import { radius } from '../tokens';
import type { Theme } from '../core/types';

export function Chip(props: {
  x: number;
  y: number;
  label: string;
  theme: Theme;
  maxWidth?: number;
  fill?: string;
  textColor?: string;
  height?: number;
}) {
  const height = props.height ?? 24;
  const paddingX = 14;
  const maxWidth = props.maxWidth ?? 220;
  const label = truncateText('chip', props.label, maxWidth - paddingX * 2);
  const textWidth = label.length * 7;
  const chipWidth = Math.min(maxWidth, textWidth + paddingX * 2);
  const chipX = props.x - chipWidth;
  const chipY = props.y - height / 2;

  return h(
    'g',
    h('rect', {
      x: chipX,
      y: chipY,
      width: chipWidth,
      height,
      rx: radius.chip,
      fill: props.fill ?? props.theme.accentSoft,
      stroke: props.theme.borderSubtle,
      'stroke-width': 1,
    }),
    h(
      'text',
      {
        x: chipX + chipWidth / 2,
        y: props.y,
        className: 'chip',
        fill: props.textColor ?? props.theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      },
      label,
    ),
  );
}