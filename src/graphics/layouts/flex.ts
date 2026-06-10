import type { Bounds } from '../core/types';

export function row(bounds: Bounds, gap: number, count: number, index: number): Bounds {
  const itemWidth = (bounds.width - gap * (count - 1)) / count;
  return {
    x: bounds.x + index * (itemWidth + gap),
    y: bounds.y,
    width: itemWidth,
    height: bounds.height,
  };
}

export function column(bounds: Bounds, gap: number, count: number, index: number): Bounds {
  const itemHeight = (bounds.height - gap * (count - 1)) / count;
  return {
    x: bounds.x,
    y: bounds.y + index * (itemHeight + gap),
    width: bounds.width,
    height: itemHeight,
  };
}

export function pad(bounds: Bounds, padding: number): Bounds {
  return {
    x: bounds.x + padding,
    y: bounds.y + padding,
    width: bounds.width - padding * 2,
    height: bounds.height - padding * 2,
  };
}

export function centerX(bounds: Bounds): number {
  return bounds.x + bounds.width / 2;
}

export function centerY(bounds: Bounds): number {
  return bounds.y + bounds.height / 2;
}