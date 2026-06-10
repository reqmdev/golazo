import { SvgDocument, h } from '../core/SvgBuilder';
import { renderCard } from '../core/RenderPipeline';
import { CANVAS_WIDTH, HELP_FOOTER_HEIGHT } from '../tokens/layout';
import type { RenderResult, Theme } from '../core/types';

export interface HelpFooterInput {
  pageId: string;
  heroTitle: string;
  heroSubtitle: string;
  brandLabel: string;
  accent: string;
}

function helpStripDefs(accent: string) {
  return h(
    'defs',
    h(
      'linearGradient',
      { id: 'help-strip-fade', x1: '0', y1: '0', x2: '0', y2: '1' },
      h('stop', { offset: '0%', 'stop-color': '#08090a', stopOpacity: 0.55 }),
      h('stop', { offset: '100%', 'stop-color': '#08090a', stopOpacity: 0.92 }),
    ),
    h(
      'linearGradient',
      { id: 'help-strip-accent', x1: '0', y1: '0', x2: '1', y2: '0' },
      h('stop', { offset: '0%', 'stop-color': accent, stopOpacity: 0 }),
      h('stop', { offset: '35%', 'stop-color': accent, stopOpacity: 0.85 }),
      h('stop', { offset: '100%', 'stop-color': accent, stopOpacity: 0.35 }),
    ),
  );
}

export async function renderHelpFooterCard(
  input: HelpFooterInput,
  theme: Theme,
): Promise<Buffer> {
  const accentY = HELP_FOOTER_HEIGHT - 5;

  const document = new SvgDocument(
    CANVAS_WIDTH,
    HELP_FOOTER_HEIGHT,
    [
      helpStripDefs(input.accent),
      h('rect', {
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: HELP_FOOTER_HEIGHT,
        fill: theme.canvas,
      }),
      h('rect', {
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: HELP_FOOTER_HEIGHT,
        fill: 'url(#help-strip-fade)',
      }),
      h(
        'text',
        {
          x: 36,
          y: HELP_FOOTER_HEIGHT / 2 - 6,
          className: 'subtitle',
          fill: theme.textPrimary,
          'dominant-baseline': 'middle',
        },
        input.heroTitle,
      ),
      input.heroSubtitle
        ? h(
            'text',
            {
              x: 36,
              y: HELP_FOOTER_HEIGHT / 2 + 16,
              className: 'caption',
              fill: theme.textMuted,
              'dominant-baseline': 'middle',
            },
            input.heroSubtitle,
          )
        : null,
      h(
        'text',
        {
          x: CANVAS_WIDTH - 36,
          y: HELP_FOOTER_HEIGHT / 2,
          className: 'overline uppercase',
          fill: theme.textSecondary,
          'text-anchor': 'end',
          'dominant-baseline': 'middle',
          'letter-spacing': '0.12em',
        },
        input.brandLabel,
      ),
      h('rect', {
        x: 0,
        y: accentY,
        width: CANVAS_WIDTH,
        height: 5,
        fill: 'url(#help-strip-accent)',
      }),
    ],
    theme.canvas,
  );

  return renderCard(document, {
    width: CANVAS_WIDTH,
    height: HELP_FOOTER_HEIGHT,
    theme,
    backgroundVariant: 'data',
    scale: 1,
  });
}

export async function renderBrandMarkCard(theme: Theme): Promise<Buffer> {
  const size = 128;
  const document = new SvgDocument(
    size,
    size,
    [
      h('rect', {
        x: 8,
        y: 8,
        width: size - 16,
        height: size - 16,
        rx: 20,
        fill: theme.surfaceRaised,
        stroke: theme.border,
        'stroke-width': 1,
      }),
      h('rect', {
        x: 28,
        y: 28,
        width: size - 56,
        height: size - 56,
        rx: 12,
        fill: theme.accentSoft,
      }),
      h(
        'text',
        {
          x: size / 2,
          y: size / 2 + 2,
          fontSize: 48,
          fill: theme.accent,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        },
        '⚽',
      ),
    ],
    theme.canvas,
  );

  return renderCard(document, {
    width: size,
    height: size,
    theme,
    scale: 1,
  });
}

export async function renderHelpFooterResult(
  input: HelpFooterInput,
  theme: Theme,
): Promise<RenderResult> {
  const buffer = await renderHelpFooterCard(input, theme);
  return {
    buffer,
    filename: `help-banner-${input.pageId}.png`,
  };
}