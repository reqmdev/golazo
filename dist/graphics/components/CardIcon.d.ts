import { SvgChild } from '../core/SvgBuilder';
export type CardIconKind = 'standings' | 'fixture' | 'teams' | 'match' | 'captain' | 'role' | 'colors' | 'played' | 'upcoming';
export declare function CardIcon(props: {
    kind: CardIconKind;
    x: number;
    y: number;
    size?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    withBadge?: boolean;
}): SvgChild;
//# sourceMappingURL=CardIcon.d.ts.map