import { h, SvgChild } from '../core/SvgBuilder';
import type { Theme } from '../core/types';

const GRADIENT_UID = 'gz';

export function gradientIds() {
  return {
    canvas: `${GRADIENT_UID}-canvas`,
    body: `${GRADIENT_UID}-body`,
    accent: `${GRADIENT_UID}-accent`,
    icon: `${GRADIENT_UID}-icon`,
    chip: `${GRADIENT_UID}-chip`,
  };
}

export function CardGradientDefs(theme: Theme): SvgChild {
  const ids = gradientIds();

  return h(
    'defs',
    h(
      'linearGradient',
      { id: ids.canvas, x1: '0', y1: '0', x2: '0', y2: '1' },
      h('stop', { offset: '0%', 'stop-color': '#10141c' }),
      h('stop', { offset: '55%', 'stop-color': '#0b0d12' }),
      h('stop', { offset: '100%', 'stop-color': '#07080a' }),
    ),
    h(
      'linearGradient',
      { id: ids.body, x1: '0', y1: '0', x2: '1', y2: '1' },
      h('stop', { offset: '0%', 'stop-color': '#1a2030', stopOpacity: 0.72 }),
      h('stop', { offset: '100%', 'stop-color': '#12151f', stopOpacity: 0.42 }),
    ),
    h(
      'linearGradient',
      { id: ids.accent, x1: '0', y1: '0', x2: '0', y2: '1' },
      h('stop', { offset: '0%', 'stop-color': theme.accent }),
      h('stop', { offset: '100%', 'stop-color': '#15803d' }),
    ),
    h(
      'linearGradient',
      { id: ids.icon, x1: '0', y1: '0', x2: '1', y2: '1' },
      h('stop', { offset: '0%', 'stop-color': 'rgba(34,197,94,0.28)' }),
      h('stop', { offset: '100%', 'stop-color': 'rgba(34,197,94,0.08)' }),
    ),
    h(
      'linearGradient',
      { id: ids.chip, x1: '0', y1: '0', x2: '1', y2: '0' },
      h('stop', { offset: '0%', 'stop-color': 'rgba(255,255,255,0.06)' }),
      h('stop', { offset: '100%', 'stop-color': 'rgba(255,255,255,0.02)' }),
    ),
  );
}