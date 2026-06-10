import { h } from '../core/SvgBuilder';
import { truncateText } from '../typography/TextMeasurer';
import type { Theme } from '../core/types';

export function ScoreDisplay(props: {
  x: number;
  y: number;
  homeGoals: number;
  awayGoals: number;
  statusLabel?: string;
  winner?: 'home' | 'away' | 'draw' | null;
  theme: Theme;
  upcoming?: boolean;
}) {
  const homeActive = props.winner === 'home';
  const awayActive = props.winner === 'away';
  const gap = 36;
  const homeX = props.x - gap;
  const awayX = props.x + gap;
  const scoreClass = props.upcoming ? 'scoreMd' : 'scoreXl';

  return h(
    'g',
    h(
      'text',
      {
        x: homeX,
        y: props.y,
        className: `${scoreClass} tabular`,
        fill: homeActive ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
        opacity: props.upcoming ? 0.5 : homeActive ? 1 : 0.7,
      },
      String(props.homeGoals),
    ),
    h(
      'text',
      {
        x: props.x,
        y: props.y,
        className: 'scoreMd tabular',
        fill: props.theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        opacity: 0.45,
      },
      props.upcoming ? '–' : '–',
    ),
    h(
      'text',
      {
        x: awayX,
        y: props.y,
        className: `${scoreClass} tabular`,
        fill: awayActive ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'start',
        'dominant-baseline': 'middle',
        opacity: props.upcoming ? 0.5 : awayActive ? 1 : 0.7,
      },
      String(props.awayGoals),
    ),
    props.statusLabel
      ? h(
          'text',
          {
            x: props.x,
            y: props.y + 26,
            className: 'chip',
            fill: props.theme.textMuted,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
          },
          truncateText('chip', props.statusLabel, 80),
        )
      : null,
  );
}