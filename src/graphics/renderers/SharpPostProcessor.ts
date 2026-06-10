import sharp from 'sharp';
import type { CompositeLayer } from '../core/types';

const BACKGROUND_OPACITY: Record<string, number> = {
  data: 0.16,
  hero: 0.32,
};

export async function postProcessPng(
  pngBuffer: Buffer,
  options: {
    width: number;
    height: number;
    scale?: number;
    backgroundVariant?: 'data' | 'hero';
    stadiumBg?: Buffer | null;
    composites?: CompositeLayer[];
  },
): Promise<Buffer> {
  const scale = options.scale ?? 2;
  const outWidth = Math.floor(options.width * scale);
  const outHeight = Math.floor(options.height * scale);
  const opacity = BACKGROUND_OPACITY[options.backgroundVariant ?? 'hero'] ?? 0.12;

  const foreground = await sharp(pngBuffer)
    .resize(outWidth, outHeight, { fit: 'fill' })
    .png()
    .toBuffer();

  const overlayComposites: sharp.OverlayOptions[] = [{ input: foreground, blend: 'over' }];

  if (options.composites?.length) {
    for (const layer of options.composites) {
      let input = layer.input;
      if (layer.opacity !== undefined && layer.opacity < 1) {
        input = await sharp(layer.input).ensureAlpha(layer.opacity).toBuffer();
      }
      overlayComposites.push({
        input,
        left: layer.left !== undefined ? Math.floor(layer.left * scale) : undefined,
        top: layer.top !== undefined ? Math.floor(layer.top * scale) : undefined,
        blend: layer.blend ?? 'over',
      });
    }
  }

  if (options.stadiumBg) {
    const fadedBg = await sharp(options.stadiumBg)
      .resize(outWidth, outHeight, { fit: 'cover' })
      .ensureAlpha(opacity)
      .toBuffer();

    return sharp(fadedBg)
      .composite(overlayComposites)
      .png({ compressionLevel: 6, quality: 90 })
      .toBuffer();
  }

  return sharp(foreground)
    .png({ compressionLevel: 6, quality: 90 })
    .toBuffer();
}