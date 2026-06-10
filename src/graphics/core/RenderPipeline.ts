import { SvgDocument } from './SvgBuilder';
import { renderSvgToPng } from '../renderers/ResvgRenderer';
import { postProcessPng } from '../renderers/SharpPostProcessor';
import { getAssetBuffer } from './AssetCache';
import { assetPaths } from '../tokens';
import type { PipelineOptions } from './types';

export async function renderCard(
  document: SvgDocument,
  options: PipelineOptions,
): Promise<Buffer> {
  const svg = document.serialize();
  const pngBuffer = renderSvgToPng(svg, {
    width: options.width,
    height: options.height,
    theme: options.theme,
    scale: options.scale,
  });

  const stadiumBg = await getAssetBuffer(assetPaths.stadiumBg);

  return postProcessPng(pngBuffer, {
    width: options.width,
    height: options.height,
    scale: options.scale,
    backgroundVariant: options.backgroundVariant,
    stadiumBg,
    composites: options.composites,
  });
}