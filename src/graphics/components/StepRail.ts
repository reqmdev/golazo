import { h } from '../core/SvgBuilder';
import { radius } from '../tokens';
import type { Theme } from '../core/types';

export function StepRail(props: {
  width: number;
  y: number;
  activeStep: number;
  accent: string;
  theme: Theme;
}) {
  const total = 6;
  const margin = 200;
  const trackStart = margin;
  const trackEnd = props.width - margin;
  const span = trackEnd - trackStart;
  const trackY = props.y;
  const children = [];

  children.push(
    h('line', {
      x1: trackStart,
      y1: trackY,
      x2: trackEnd,
      y2: trackY,
      stroke: 'rgba(255,255,255,0.12)',
      'stroke-width': 3,
      'stroke-linecap': 'round',
    }),
  );

  if (props.activeStep > 1) {
    const progressEnd = trackStart + (span * (props.activeStep - 1)) / (total - 1);
    children.push(
      h('line', {
        x1: trackStart,
        y1: trackY,
        x2: progressEnd,
        y2: trackY,
        stroke: props.accent,
        'stroke-width': 3,
        'stroke-linecap': 'round',
      }),
    );
  }

  for (let step = 1; step <= total; step += 1) {
    const centerX = trackStart + (span * (step - 1)) / (total - 1);
    const active = props.activeStep > 0 && step === props.activeStep;
    const done = props.activeStep > 0 && step < props.activeStep;
    const size = active ? 36 : 30;
    const boxX = centerX - size / 2;
    const boxY = trackY - size / 2;
    const fill = active ? props.accent : done ? props.theme.accentSoft : props.theme.surfaceHover;

    children.push(
      h('rect', {
        x: boxX,
        y: boxY,
        width: size,
        height: size,
        rx: radius.chip,
        fill,
        stroke: active ? props.accent : done ? props.theme.border : props.theme.border,
        'stroke-width': active || done ? 1.5 : 1,
      }),
      h(
        'text',
        {
          x: centerX,
          y: trackY + 1,
          className: active ? 'stepActive' : 'stepIdle',
          fill: active ? '#052e16' : done ? props.accent : props.theme.textMuted,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        },
        String(step),
      ),
    );
  }

  return h('g', children);
}