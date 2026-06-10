import { h } from '../core/SvgBuilder';
import { Surface } from './Surface';
import { StatusPill } from './StatPill';
import { truncateText } from '../typography/TextMeasurer';
import { surfaces, depth } from '../tokens/surfaces';
import type { Theme } from '../core/types';

/** Compact sports-app top bar — left-aligned hierarchy, no centered billboard. */
export function AppHeader(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  badge?: string;
  meta?: string;
  theme: Theme;
}) {
  const padL = 16;
  const titleY = 22;
  const subY = 38;

  return Surface({
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    theme: props.theme,
    variant: 'overlay',
    accentBar: true,
    children: [
      h(
        'text',
        {
          x: padL,
          y: titleY,
          className: 'title',
          fill: props.theme.textPrimary,
          'dominant-baseline': 'middle',
        },
        truncateText('title', props.title, props.width - 200),
      ),
      props.subtitle
        ? h(
            'text',
            {
              x: padL,
              y: subY,
              className: 'caption',
              fill: props.theme.textMuted,
              'dominant-baseline': 'middle',
            },
            truncateText('caption', props.subtitle, props.width - 200),
          )
        : null,
      props.meta
        ? h(
            'text',
            {
              x: props.width - padL,
              y: titleY,
              className: 'overline uppercase',
              fill: props.theme.textSecondary,
              'text-anchor': 'end',
              'dominant-baseline': 'middle',
            },
            truncateText('overline', props.meta, 160),
          )
        : null,
      props.badge
        ? StatusPill({
            x: props.width - padL,
            y: subY,
            label: props.badge,
            theme: props.theme,
            align: 'right',
            tone: 'accent',
          })
        : null,
      h('rect', {
        x: padL,
        y: props.height - 1,
        width: props.width - padL * 2,
        height: 1,
        fill: surfaces.strokeSubtle,
      }),
    ],
  });
}