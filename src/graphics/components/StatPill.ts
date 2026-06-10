import { h } from '../core/SvgBuilder';
import { truncateText } from '../typography/TextMeasurer';
import { surfaces } from '../tokens/surfaces';
import { radius } from '../tokens';
import type { Theme } from '../core/types';

export function StatPill(props: {
  x: number;
  y: number;
  width: number;
  label: string;
  value: string;
  theme: Theme;
  emphasize?: boolean;
}) {
  const hgt = 36;
  const y0 = props.y - hgt / 2;

  return h(
    'g',
    h('rect', {
      x: props.x,
      y: y0,
      width: props.width,
      height: hgt,
      rx: radius.chip,
      fill: surfaces.inset,
      stroke: surfaces.strokeSubtle,
      'stroke-width': 1,
    }),
    h(
      'text',
      {
        x: props.x + 10,
        y: y0 + 12,
        className: 'overline uppercase',
        fill: props.theme.textMuted,
        'dominant-baseline': 'middle',
      },
      truncateText('overline', props.label, props.width - 20),
    ),
    h(
      'text',
      {
        x: props.x + 10,
        y: y0 + 26,
        className: 'statLg tabular',
        fill: props.emphasize ? props.theme.textPrimary : props.theme.textSecondary,
        'dominant-baseline': 'middle',
      },
      truncateText('statLg', props.value, props.width - 20),
    ),
  );
}

export function StatusPill(props: {
  x: number;
  y: number;
  label: string;
  theme: Theme;
  align?: 'left' | 'right' | 'center';
  tone?: 'accent' | 'muted' | 'live';
}) {
  const padX = 10;
  const hgt = 22;
  const textW = props.label.length * 6.5 + padX * 2;
  const pillW = Math.min(120, Math.max(44, textW));
  const pillX =
    props.align === 'right'
      ? props.x - pillW
      : props.align === 'center'
        ? props.x - pillW / 2
        : props.x;
  const pillY = props.y - hgt / 2;

  const fills = {
    accent: props.theme.accentSoft,
    muted: surfaces.inset,
    live: 'rgba(34, 197, 94, 0.2)',
  };
  const textColors = {
    accent: props.theme.accent,
    muted: props.theme.textMuted,
    live: props.theme.accent,
  };
  const tone = props.tone ?? 'muted';

  return h(
    'g',
    h('rect', {
      x: pillX,
      y: pillY,
      width: pillW,
      height: hgt,
      rx: radius.chip,
      fill: fills[tone],
      stroke: tone === 'live' ? props.theme.accent : surfaces.strokeSubtle,
      'stroke-width': 1,
    }),
    h(
      'text',
      {
        x: pillX + pillW / 2,
        y: props.y,
        className: 'chip uppercase',
        fill: textColors[tone],
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      },
      truncateText('chip', props.label, pillW - 8),
    ),
  );
}