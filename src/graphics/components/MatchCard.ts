import { h } from '../core/SvgBuilder';
import { Surface } from './Surface';
import { TeamLogo } from './TeamLogo';
import { StatusPill } from './StatPill';
import { truncateText } from '../typography/TextMeasurer';
import { surfaces } from '../tokens/surfaces';
import { layout } from '../tokens/layout';
import type { Theme } from '../core/types';

export function MatchCard(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  row: {
    home: { id: string; name: string; shortName?: string; color?: string };
    away: { id: string; name: string; shortName?: string; color?: string };
    scoreText: string;
    isPlayed?: boolean;
    leg?: number;
    round?: number;
  };
  logos: Map<string, Buffer | null>;
  index: number;
  theme: Theme;
  legLabel?: (leg: number) => string;
  playedLabel?: string;
  upcomingLabel?: string;
}) {
  const pad = 12;
  const logoSize = layout.logoSizeMd;
  const midY = props.height / 2 + 6;
  const scoreX = props.width / 2;

  const statusLabel = props.row.isPlayed
    ? props.playedLabel || 'Played'
    : props.upcomingLabel || 'Upcoming';
  const statusTone = props.row.isPlayed ? 'muted' : 'live';

  return Surface({
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    theme: props.theme,
    variant: props.index % 2 === 0 ? 'raised' : 'overlay',
    children: [
      props.row.leg && props.row.leg > 1 && props.legLabel
        ? StatusPill({
            x: pad,
            y: 14,
            label: props.legLabel(props.row.leg),
            theme: props.theme,
            tone: 'muted',
          })
        : null,
      StatusPill({
        x: props.width - pad,
        y: 14,
        label: statusLabel,
        theme: props.theme,
        align: 'right',
        tone: statusTone,
      }),
      h('line', {
        x1: pad,
        y1: 28,
        x2: props.width - pad,
        y2: 28,
        stroke: surfaces.strokeSubtle,
        'stroke-width': 1,
      }),
      TeamLogo({
        x: pad,
        y: midY - logoSize / 2,
        size: logoSize,
        logoBuffer: props.logos.get(props.row.home.id) ?? null,
        team: props.row.home,
        clipId: `fixture-home-${props.row.home.id}-${props.index}`,
      }),
      h(
        'text',
        {
          x: pad + logoSize + 10,
          y: midY - 4,
          className: 'bodySm',
          fill: props.theme.textPrimary,
          'dominant-baseline': 'middle',
        },
        truncateText('bodySm', props.row.home.name, scoreX - pad - logoSize - 80),
      ),
      props.row.home.shortName
        ? h(
            'text',
            {
              x: pad + logoSize + 10,
              y: midY + 12,
              className: 'overline uppercase',
              fill: props.theme.textMuted,
              'dominant-baseline': 'middle',
            },
            truncateText('overline', props.row.home.shortName, 32),
          )
        : null,
      h('rect', {
        x: scoreX - 40,
        y: midY - 18,
        width: 80,
        height: 36,
        rx: 6,
        fill: surfaces.inset,
        stroke: surfaces.strokeSubtle,
        'stroke-width': 1,
      }),
      h(
        'text',
        {
          x: scoreX,
          y: midY,
          className: 'scoreMd tabular',
          fill: props.row.isPlayed ? props.theme.textPrimary : props.theme.textMuted,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        },
        props.row.scoreText,
      ),
      TeamLogo({
        x: props.width - pad - logoSize,
        y: midY - logoSize / 2,
        size: logoSize,
        logoBuffer: props.logos.get(props.row.away.id) ?? null,
        team: props.row.away,
        clipId: `fixture-away-${props.row.away.id}-${props.index}`,
      }),
      h(
        'text',
        {
          x: props.width - pad - logoSize - 10,
          y: midY - 4,
          className: 'bodySm',
          fill: props.theme.textPrimary,
          'text-anchor': 'end',
          'dominant-baseline': 'middle',
        },
        truncateText('bodySm', props.row.away.name, scoreX - pad - logoSize - 80),
      ),
      props.row.away.shortName
        ? h(
            'text',
            {
              x: props.width - pad - logoSize - 10,
              y: midY + 12,
              className: 'overline uppercase',
              fill: props.theme.textMuted,
              'text-anchor': 'end',
              'dominant-baseline': 'middle',
            },
            truncateText('overline', props.row.away.shortName, 32),
          )
        : null,
    ],
  });
}