import { h } from '../core/SvgBuilder';
import { TeamLogo } from './TeamLogo';
import { ScoreDisplay } from './ScoreDisplay';
import { truncateText } from '../typography/TextMeasurer';
import { layout } from '../tokens/layout';
import type { Theme } from '../core/types';

interface TeamSide {
  id: string;
  name: string;
  shortName?: string;
  color?: string | null;
}

export function MatchHeroRow(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  home: TeamSide;
  away: TeamSide;
  homeLogo?: Buffer | null;
  awayLogo?: Buffer | null;
  homeGoals: number;
  awayGoals: number;
  statusLabel: string;
  winner?: 'home' | 'away' | 'draw' | null;
  theme: Theme;
}) {
  const pad = 0;
  const logoSize = layout.heroLogoSize;
  const midY = props.height / 2;
  const centerX = props.width / 2;
  const laneW = Math.floor((props.width - 200) / 2);
  const homeActive = props.winner === 'home';
  const awayActive = props.winner === 'away';

  return h(
    'g',
    { transform: `translate(${props.x},${props.y})` },
    TeamLogo({
      x: pad,
      y: midY - logoSize / 2,
      size: logoSize,
      logoBuffer: props.homeLogo,
      team: { name: props.home.name, color: props.home.color ?? undefined },
      clipId: `hero-home-${props.home.id}`,
    }),
    h(
      'text',
      {
        x: pad + logoSize + 14,
        y: midY - 8,
        className: 'subtitle',
        fill: homeActive ? props.theme.textPrimary : props.theme.textSecondary,
        'dominant-baseline': 'middle',
      },
      truncateText('subtitle', props.home.name, laneW - logoSize - 20),
    ),
    props.home.shortName
      ? h(
          'text',
          {
            x: pad + logoSize + 14,
            y: midY + 12,
            className: 'caption',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
          },
          truncateText('caption', props.home.shortName, 48),
        )
      : null,
    ScoreDisplay({
      x: centerX,
      y: midY,
      homeGoals: props.homeGoals,
      awayGoals: props.awayGoals,
      winner: props.winner,
      theme: props.theme,
    }),
    TeamLogo({
      x: props.width - pad - logoSize,
      y: midY - logoSize / 2,
      size: logoSize,
      logoBuffer: props.awayLogo,
      team: { name: props.away.name, color: props.away.color ?? undefined },
      clipId: `hero-away-${props.away.id}`,
    }),
    h(
      'text',
      {
        x: props.width - pad - logoSize - 14,
        y: midY - 8,
        className: 'subtitle',
        fill: awayActive ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
      },
      truncateText('subtitle', props.away.name, laneW - logoSize - 20),
    ),
    props.away.shortName
      ? h(
          'text',
          {
            x: props.width - pad - logoSize - 14,
            y: midY + 12,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
          },
          truncateText('caption', props.away.shortName, 48),
        )
      : null,
  );
}