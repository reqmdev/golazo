import { h } from '../core/SvgBuilder';
import { TeamLogo } from './TeamLogo';
import { truncateText } from '../typography/TextMeasurer';
import { layout } from '../tokens/layout';
import type { TypeVariant } from '../typography/styles';
import type { Theme } from '../core/types';

export function TeamRow(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  team: { id: string; name: string; displayName?: string; shortName?: string; color?: string; form?: string[] };
  logoBuffer?: Buffer | null;
  logoSize?: number;
  logoGap?: number;
  nameClass?: TypeVariant;
  theme: Theme;
}) {
  const logoSize = props.logoSize ?? layout.logoSize;
  const logoGap = props.logoGap ?? 10;
  const nameClass = props.nameClass ?? 'bodySm';
  const midY = props.y + props.height / 2;
  const logoY = midY - logoSize / 2;
  const textX = props.x + logoSize + logoGap;
  const textWidth = props.width - (logoSize + logoGap + 4);
  const shortName = props.team.shortName?.trim();

  const children = [
    TeamLogo({
      x: props.x,
      y: logoY,
      size: logoSize,
      logoBuffer: props.logoBuffer,
      team: props.team,
      clipId: `logo-${props.team.id}-${props.x}-${props.y}`,
    }),
    h(
      'text',
      {
        x: textX,
        y: shortName ? midY - 9 : midY,
        className: nameClass,
        fill: props.theme.textPrimary,
        'dominant-baseline': 'middle',
      },
      truncateText(nameClass, props.team.name, shortName ? textWidth - 44 : textWidth),
    ),
  ];

  if (shortName) {
    children.push(
      h(
        'text',
        {
          x: textX,
          y: midY + 11,
          className: 'caption',
          fill: props.theme.textMuted,
          'dominant-baseline': 'middle',
        },
        truncateText('caption', shortName, 40),
      ),
    );
  }

  return h('g', children);
}