import { h } from '../core/SvgBuilder';
import { StatusPill } from './StatPill';
import { surfaces } from '../tokens/surfaces';
import { layout, radius } from '../tokens';
import type { Theme } from '../core/types';

export function ScoreModule(props: {
  centerX: number;
  centerY: number;
  scoreText: string;
  statusLabel: string;
  theme: Theme;
  highlight?: boolean;
}) {
  const w = layout.scoreBoxWidth;
  const hgt = layout.scoreBoxHeight;
  const x = props.centerX - w / 2;
  const y = props.centerY - hgt / 2;

  return h(
    'g',
    h('rect', {
      x,
      y,
      width: w,
      height: hgt,
      rx: radius.card,
      fill: surfaces.inset,
      stroke: props.highlight ? props.theme.accent : surfaces.stroke,
      'stroke-width': props.highlight ? 1.5 : 1,
    }),
    h('rect', {
      x: x + 1,
      y: y + 1,
      width: w - 2,
      height: 1,
      fill: 'rgba(255,255,255,0.05)',
    }),
    h(
      'text',
      {
        x: props.centerX,
        y: props.centerY - 6,
        className: 'scoreXl tabular',
        fill: props.theme.textPrimary,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      },
      props.scoreText,
    ),
    StatusPill({
      x: props.centerX,
      y: props.centerY + 28,
      label: props.statusLabel,
      theme: props.theme,
      align: 'center',
      tone: props.statusLabel === 'FT' || props.statusLabel.includes('WO') ? 'muted' : 'live',
    }),
  );
}