import { h } from '../core/SvgBuilder';
import { surfaces } from '../tokens/surfaces';
import { radius } from '../tokens';
import type { Theme } from '../core/types';

/** Goal-share bar derived from actual score data — not fabricated stats. */
export function GoalShareBar(props: {
  x: number;
  y: number;
  width: number;
  homeGoals: number;
  awayGoals: number;
  homeLabel: string;
  awayLabel: string;
  theme: Theme;
}) {
  const barH = 8;
  const total = props.homeGoals + props.awayGoals;
  const homePct = total > 0 ? props.homeGoals / total : 0.5;
  const homeW = Math.max(4, Math.round((props.width - 4) * homePct));
  const awayW = props.width - 4 - homeW;
  const trackY = props.y + 14;

  return h(
    'g',
    h(
      'text',
      {
        x: props.x,
        y: props.y,
        className: 'overline uppercase',
        fill: props.theme.textMuted,
        'dominant-baseline': 'middle',
      },
      'Goal share',
    ),
    h(
      'text',
      {
        x: props.x + props.width,
        y: props.y,
        className: 'stat tabular',
        fill: props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
      },
      `${Math.round(homePct * 100)}% — ${Math.round((1 - homePct) * 100)}%`,
    ),
    h('rect', {
      x: props.x,
      y: trackY,
      width: props.width,
      height: barH,
      rx: radius.chip,
      fill: surfaces.inset,
    }),
    h('rect', {
      x: props.x,
      y: trackY,
      width: homeW,
      height: barH,
      rx: radius.chip,
      fill: props.theme.accent,
    }),
    awayW > 0
      ? h('rect', {
          x: props.x + homeW,
          y: trackY,
          width: awayW,
          height: barH,
          rx: radius.chip,
          fill: props.theme.textMuted,
          opacity: 0.35,
        })
      : null,
    h(
      'text',
      {
        x: props.x,
        y: trackY + barH + 14,
        className: 'caption',
        fill: props.theme.textSecondary,
        'dominant-baseline': 'middle',
      },
      truncateLabel(props.homeLabel, 18),
    ),
    h(
      'text',
      {
        x: props.x + props.width,
        y: trackY + barH + 14,
        className: 'caption',
        fill: props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
      },
      truncateLabel(props.awayLabel, 18),
    ),
  );
}

function truncateLabel(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}