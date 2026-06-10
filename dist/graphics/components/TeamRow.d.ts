import type { TypeVariant } from '../typography/styles';
import type { Theme } from '../core/types';
export declare function TeamRow(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    team: {
        id: string;
        name: string;
        displayName?: string;
        shortName?: string;
        color?: string;
        form?: string[];
    };
    logoBuffer?: Buffer | null;
    logoSize?: number;
    logoGap?: number;
    nameClass?: TypeVariant;
    theme: Theme;
}): import("../core/SvgBuilder").SvgNode;
//# sourceMappingURL=TeamRow.d.ts.map