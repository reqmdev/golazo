import { measureText } from '../typography/TextMeasurer';
import { cardIconOpticalOffsetX } from '../utils/contentBlock';
import type { CardIconKind } from './CardIcon';

const DEFAULT_HEADER_ICON_SIZE = 11;
const DEFAULT_HEADER_ICON_GAP = 4;

export function headerIconPad(iconKind?: CardIconKind, iconSize = DEFAULT_HEADER_ICON_SIZE): number {
  const gap = Math.round(DEFAULT_HEADER_ICON_GAP * (iconSize / DEFAULT_HEADER_ICON_SIZE));
  return iconKind ? iconSize + gap : 0;
}

/**
 * Place column header icon + label; icon always leads, group centered when needed.
 */
export function resolveHeaderCellLayout(
  offset: number,
  column: { label: string; width: number; align?: 'left' | 'center' | 'right'; type?: string },
  iconKind?: CardIconKind,
  headerIconSize = DEFAULT_HEADER_ICON_SIZE,
): {
  iconX: number;
  textX: number;
  textAnchor: 'start' | 'middle' | 'end';
  iconSize: number;
} {
  const iconPad = headerIconPad(iconKind, headerIconSize);
  const iconOpticalX = iconKind ? cardIconOpticalOffsetX(headerIconSize) : 0;
  const label = column.label.toUpperCase();
  const labelWidth = measureText('overline', label);
  const groupWidth = iconPad + labelWidth;

  if (column.align === 'center') {
    const groupStart = offset + Math.max(0, (column.width - groupWidth) / 2);
    return {
      iconX: groupStart + iconOpticalX,
      textX: groupStart + iconOpticalX + iconPad,
      textAnchor: 'start',
      iconSize: headerIconSize,
    };
  }

  if (column.align === 'right') {
    const groupEnd = offset + column.width - 4;
    return {
      iconX: groupEnd - groupWidth + iconOpticalX,
      textX: groupEnd - labelWidth + iconOpticalX,
      textAnchor: 'start',
      iconSize: headerIconSize,
    };
  }

  const groupStart = offset + (column.type === 'team' ? 0 : 4);
  return {
    iconX: groupStart + iconOpticalX,
    textX: groupStart + iconOpticalX + iconPad,
    textAnchor: 'start',
    iconSize: headerIconSize,
  };
}