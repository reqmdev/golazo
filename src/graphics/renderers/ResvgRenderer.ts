import { Resvg } from '@resvg/resvg-js';
import { getFontRegistry } from '../core/FontRegistry';
import type { Theme } from '../core/types';

export interface ResvgRenderOptions {
  width: number;
  height: number;
  theme: Theme;
  scale?: number;
}

export function renderSvgToPng(svg: string, options: ResvgRenderOptions): Buffer {
  const scale = options.scale ?? 2;
  const registry = getFontRegistry();

  const resvg = new Resvg(svg, {
    background: options.theme.canvas,
    fitTo: { mode: 'zoom', value: scale },
    font: registry.getResvgFontOptions(),
    dpi: 96,
    shapeRendering: 2,
    textRendering: 1,
    imageRendering: 0,
    logLevel: 'off',
  });

  const pngData = resvg.render();
  return pngData.asPng();
}