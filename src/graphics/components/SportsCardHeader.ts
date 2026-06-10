import { h } from '../core/SvgBuilder';
import { truncateText } from '../typography/TextMeasurer';
import { surfaces } from '../tokens/surfaces';
import { card } from '../tokens/cardLayout';
import { cardHeaderIcon } from '../utils/contentBlock';
import { CardIcon, CardIconKind } from './CardIcon';
import type { Theme } from '../core/types';

export function SportsCardHeader(props: {
  x: number;
  y: number;
  width: number;
  title: string;
  subtitle?: string;
  status?: string;
  meta?: string;
  icon?: CardIconKind;
  iconSize?: number;
  /** Show hairline below header (default true). */
  showDivider?: boolean;
  theme: Theme;
}) {
  const hgt = card.headerHeight;
  const iconSize = props.iconSize ?? cardHeaderIcon.size;
  const iconGap = Math.round(cardHeaderIcon.gap * (iconSize / cardHeaderIcon.size));
  const iconX = Math.round(cardHeaderIcon.opticalOffsetX * (iconSize / cardHeaderIcon.size));
  const iconOffsetY = Math.round(cardHeaderIcon.offsetY * (iconSize / cardHeaderIcon.size));
  const titleX = props.icon ? iconX + iconSize + iconGap : 0;
  const textWidth = props.width - 96 - titleX;

  return h(
    'g',
    { transform: `translate(${props.x},${props.y})` },
    props.icon
      ? CardIcon({
          kind: props.icon,
          x: iconX,
          y: iconOffsetY,
          size: iconSize,
          stroke: props.theme.textMuted,
          strokeWidth: 1.7,
        })
      : null,
    h(
      'text',
      {
        x: titleX,
        y: 20,
        className: 'title',
        fill: props.theme.textPrimary,
        'dominant-baseline': 'middle',
      },
      truncateText('title', props.title, textWidth),
    ),
    props.subtitle
      ? h(
          'text',
          {
            x: titleX,
            y: 40,
            className: 'caption',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
          },
          truncateText('caption', props.subtitle, textWidth),
        )
      : null,
    props.meta
      ? h(
          'text',
          {
            x: props.width,
            y: 20,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
          },
          truncateText('caption', props.meta, 100),
        )
      : null,
    props.status
      ? h(
          'text',
          {
            x: props.width,
            y: 40,
            className: 'chip',
            fill: props.theme.textSecondary,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
          },
          truncateText('chip', props.status, 100),
        )
      : null,
    props.showDivider !== false
      ? h('line', {
          x1: 0,
          y1: hgt,
          x2: props.width,
          y2: hgt,
          stroke: surfaces.strokeSubtle,
          'stroke-width': 1,
          opacity: 0.45,
        })
      : null,
  );
}