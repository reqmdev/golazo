import * as fs from 'fs';
import * as path from 'path';
import * as opentype from 'opentype.js';
import { typeScale, TypeVariant } from './styles';
import { getFontRegistry } from '../core/FontRegistry';

const fontCache = new Map<string, opentype.Font>();

function projectRoot(): string {
  return path.join(__dirname, '..', '..', '..');
}

function loadFont(variant: TypeVariant): opentype.Font | null {
  const spec = typeScale[variant];
  const weightKey = spec.weight >= 700 ? 'Bold' : spec.weight >= 600 ? 'SemiBold' : spec.weight >= 500 ? 'Medium' : 'Regular';
  const familyKey = spec.family === 'GolazoMono' ? 'JetBrainsMono' : 'Inter';
  const cacheKey = `${familyKey}-${weightKey}`;

  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }

  const fontsDir = path.join(projectRoot(), 'src', 'assets', 'fonts');
  const candidates = [
    path.join(fontsDir, `${familyKey}-${weightKey}.ttf`),
    path.join(fontsDir, `${familyKey}-Regular.ttf`),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      const font = opentype.parse(fs.readFileSync(filePath));
      fontCache.set(cacheKey, font);
      return font;
    }
  }

  const registry = getFontRegistry();
  for (const filePath of registry.getFontFiles()) {
    if (fs.existsSync(filePath)) {
      try {
        const font = opentype.parse(fs.readFileSync(filePath));
        fontCache.set(cacheKey, font);
        return font;
      } catch {
        // try next
      }
    }
  }

  return null;
}

export function measureText(variant: TypeVariant, text: string): number {
  const font = loadFont(variant);
  const spec = typeScale[variant];
  if (!font) return text.length * spec.size * 0.55;
  return font.getAdvanceWidth(text, spec.size);
}

export function truncateText(variant: TypeVariant, text: string, maxWidth: number): string {
  if (!text) return '';
  if (measureText(variant, text) <= maxWidth) return text;

  const ellipsis = '…';
  let low = 0;
  let high = text.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = `${text.slice(0, mid)}${ellipsis}`;
    if (measureText(variant, candidate) <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return `${text.slice(0, low)}${ellipsis}`;
}

export function teamInitials(name: string, maxLen = 2): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase().slice(0, maxLen);
  }
  return name.trim().slice(0, maxLen).toUpperCase();
}