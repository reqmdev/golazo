import { h, SvgChild } from '../core/SvgBuilder';
import { gradientIds } from './CardGradients';

export type CardIconKind =
  | 'standings'
  | 'fixture'
  | 'teams'
  | 'match'
  | 'captain'
  | 'role'
  | 'colors'
  | 'played'
  | 'upcoming';

const PATHS: Record<CardIconKind, string> = {
  standings:
    'M4 18V8m6 10V4m6 14v-8',
  fixture:
    'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4h12M8 2v4m8-4v4',
  teams:
    'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 19a5 5 0 0 1 10 0M14 19a4 4 0 0 1 7 0',
  match:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 5.2 2.4 1.4-2.4 1.4V7.2zm3.6 3.6 2.4 1.4-2.4 1.4v-2.8z',
  captain:
    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-6 8a6 6 0 0 1 12 0',
  role:
    'M12 3l7 3v6c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z',
  colors:
    'M5 18h14M7 14h2m4 0h2M9 6h6l1 8H8l1-8z',
  played:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 10.5 2.5 2.5 5-5.5',
  upcoming:
    'M7 3v3M17 3v3M5 7h14M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm4 9h6',
};

export function CardIcon(props: {
  kind: CardIconKind;
  x: number;
  y: number;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  withBadge?: boolean;
}): SvgChild {
  const size = props.size ?? 20;
  const scale = size / 24;
  const stroke = props.stroke ?? 'currentColor';
  const strokeWidth = props.strokeWidth ?? 1.8;
  const path = PATHS[props.kind];

  const icon = h(
    'g',
    { transform: `translate(${props.x},${props.y}) scale(${scale})` },
    h('path', {
      d: path,
      fill: props.fill ?? 'none',
      stroke,
      'stroke-width': strokeWidth / scale,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  );

  if (!props.withBadge) {
    return icon;
  }

  const ids = gradientIds();
  const pad = 6;

  return h(
    'g',
    h('rect', {
      x: props.x - pad,
      y: props.y - pad,
      width: size + pad * 2,
      height: size + pad * 2,
      rx: 10,
      fill: `url(#${ids.icon})`,
      stroke: 'rgba(34,197,94,0.22)',
      'stroke-width': 1,
    }),
    icon,
  );
}