import type { Theme } from '../core/types';
export declare function StatPill(props: {
    x: number;
    y: number;
    width: number;
    label: string;
    value: string;
    theme: Theme;
    emphasize?: boolean;
}): import("../core/SvgBuilder").SvgNode;
export declare function StatusPill(props: {
    x: number;
    y: number;
    label: string;
    theme: Theme;
    align?: 'left' | 'right' | 'center';
    tone?: 'accent' | 'muted' | 'live';
}): import("../core/SvgBuilder").SvgNode;
//# sourceMappingURL=StatPill.d.ts.map