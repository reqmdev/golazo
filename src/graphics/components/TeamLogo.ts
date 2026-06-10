import { h } from '../core/SvgBuilder';
import { bufferToDataUri } from '../utils/dataUri';
import { contrastText } from '../utils/colors';
import { teamInitials } from '../typography/TextMeasurer';
import { radius } from '../tokens';

export function TeamLogo(props: {
  x: number;
  y: number;
  size: number;
  logoBuffer?: Buffer | null;
  team: { name: string; color?: string };
  clipId: string;
}) {
  const r = radius.logo;
  const inner = props.size;

  const children = [];

  if (props.logoBuffer) {
    children.push(
      h('defs', h('clipPath', { id: props.clipId }, h('rect', {
        x: props.x,
        y: props.y,
        width: inner,
        height: inner,
        rx: r,
      }))),
      h('image', {
        x: props.x,
        y: props.y,
        width: inner,
        height: inner,
        href: bufferToDataUri(props.logoBuffer),
        'clip-path': `url(#${props.clipId})`,
        preserveAspectRatio: 'xMidYMid slice',
      }),
      h('rect', {
        x: props.x - 1,
        y: props.y - 1,
        width: inner + 2,
        height: inner + 2,
        rx: r + 1,
        fill: 'none',
        stroke: 'rgba(255,255,255,0.14)',
        'stroke-width': 1,
      }),
    );
  } else {
    const color = props.team.color || '#2a2f38';
    children.push(
      h('rect', {
        x: props.x,
        y: props.y,
        width: inner,
        height: inner,
        rx: r,
        fill: color,
      }),
      h(
        'text',
        {
          x: props.x + props.size / 2,
          y: props.y + props.size / 2 + 1,
          className: 'caption',
          fill: contrastText(color),
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        },
        teamInitials(props.team.name),
      ),
    );
  }

  return h('g', children);
}