import type { CardIconKind } from './CardIcon';
export declare function headerIconPad(iconKind?: CardIconKind, iconSize?: number): number;
/**
 * Place column header icon + label; icon always leads, group centered when needed.
 */
export declare function resolveHeaderCellLayout(offset: number, column: {
    label: string;
    width: number;
    align?: 'left' | 'center' | 'right';
    type?: string;
}, iconKind?: CardIconKind, headerIconSize?: number): {
    iconX: number;
    textX: number;
    textAnchor: 'start' | 'middle' | 'end';
    iconSize: number;
};
//# sourceMappingURL=tableHeaderCell.d.ts.map