import { SvgChild } from '../core/SvgBuilder';
import type { Theme } from '../core/types';
export type SurfaceVariant = 'raised' | 'inset' | 'overlay' | 'transparent';
export declare function Surface(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    theme: Theme;
    variant?: SurfaceVariant;
    rx?: number;
    accentBar?: boolean;
    children?: SvgChild | SvgChild[];
}): import("../core/SvgBuilder").SvgNode;
//# sourceMappingURL=Surface.d.ts.map