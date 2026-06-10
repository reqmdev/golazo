import { h } from '../core/SvgBuilder';
import { Surface } from './Surface';
import { TeamLogo } from './TeamLogo';
import { ScoreModule } from './ScoreModule';
import { truncateText } from '../typography/TextMeasurer';
import { surfaces } from '../tokens/surfaces';
import { layout } from '../tokens/layout';
import type { Theme } from '../core/types';

interface TeamSide {
  id: string;
  name: string;
  shortName?: string;
  color?: string;
}

export function MatchHero(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  home: TeamSide;
  away: TeamSide;
  homeLogo?: Buffer | null;
  awayLogo?: Buffer | null;
  scoreText: string;
  statusLabel: string;
  winner?: 'home' | 'away' | 'draw' | null;
  theme: Theme;
}) {
  const pad = 16;
  const logoSize = layout.heroLogoSize;
  const midY = props.height / 2;
  const centerX = props.width / 2;
  const laneW = Math.floor((props.width - layout.scoreBoxWidth - pad * 2) / 2);

  const homeActive = props.winner === 'home';
  const awayActive = props.winner === 'away';

  return Surface({
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    theme: props.theme,
    variant: 'raised',
    children: [
      h('line', {
        x1: centerX - layout.scoreBoxWidth / 2 - 12,
        y1: 14,
        x2: centerX - layout.scoreBoxWidth / 2 - 12,
        y2: props.height - 14,
        stroke: surfaces.strokeSubtle,
        'stroke-width': 1,
      }),
      h('line', {
        x1: centerX + layout.scoreBoxWidth / 2 + 12,
        y1: 14,
        x2: centerX + layout.scoreBoxWidth / 2 + 12,
        y2: props.height - 14,
        stroke: surfaces.strokeSubtle,
        'stroke-width': 1,
      }),
      TeamLogo({
        x: pad,
        y: midY - logoSize / 2,
        size: logoSize,
        logoBuffer: props.homeLogo,
        team: props.home,
        clipId: `hero-home-${props.home.id}`,
      }),
      h(
        'text',
        {
          x: pad + logoSize + 12,
          y: midY - 10,
          className: 'subtitle',
          fill: homeActive ? props.theme.textPrimary : props.theme.textSecondary,
          'dominant-baseline': 'middle',
        },
        truncateText('subtitle', props.home.name, laneW - logoSize - 16),
      ),
      props.home.shortName
        ? h(
            'text',
            {
              x: pad + logoSize + 12,
              y: midY + 14,
              className: 'overline uppercase',
              fill: props.theme.textMuted,
              'dominant-baseline': 'middle',
            },
            truncateText('overline', props.home.shortName, 48),
          )
        : null,
      homeActive
        ? h('rect', {
            x: pad + logoSize + 12,
            y: midY + 26,
            width: 24,
            height: 3,
            rx: 1,
            fill: props.theme.accent,
          })
        : null,
      ScoreModule({
        centerX,
        centerY: midY,
        scoreText: props.scoreText,
        statusLabel: props.statusLabel,
        theme: props.theme,
        highlight: props.winner !== 'draw' && props.winner != null,
      }),
      TeamLogo({
        x: props.width - pad - logoSize,
        y: midY - logoSize / 2,
        size: logoSize,
        logoBuffer: props.awayLogo,
        team: props.away,
        clipId: `hero-away-${props.away.id}`,
      }),
      h(
        'text',
        {
          x: props.width - pad - logoSize - 12,
          y: midY - 10,
          className: 'subtitle',
          fill: awayActive ? props.theme.textPrimary : props.theme.textSecondary,
          'text-anchor': 'end',
          'dominant-baseline': 'middle',
        },
        truncateText('subtitle', props.away.name, laneW - logoSize - 16),
      ),
      props.away.shortName
        ? h(
            'text',
            {
              x: props.width - pad - logoSize - 12,
              y: midY + 14,
              className: 'overline uppercase',
              fill: props.theme.textMuted,
              'text-anchor': 'end',
              'dominant-baseline': 'middle',
            },
            truncateText('overline', props.away.shortName, 48),
          )
        : null,
      awayActive
        ? h('rect', {
            x: props.width - pad - logoSize - 12 - 24,
            y: midY + 26,
            width: 24,
            height: 3,
            rx: 1,
            fill: props.theme.accent,
          })
        : null,
    ],
  });
}