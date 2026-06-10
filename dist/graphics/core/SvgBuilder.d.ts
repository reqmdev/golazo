export type SvgAttrs = Record<string, string | number | undefined | null | boolean>;
export type SvgChild = SvgNode | string | number | null | undefined | false;
export interface SvgNode {
    tag: string;
    attrs: SvgAttrs;
    children: SvgChild[];
}
export declare function h(tag: string, attrs?: SvgAttrs | SvgChild | SvgChild[], ...children: SvgChild[]): SvgNode;
export declare class SvgDocument {
    private readonly width;
    private readonly height;
    private readonly children;
    private readonly background;
    constructor(width: number, height: number, children: SvgChild[], background?: string);
    serialize(): string;
}
//# sourceMappingURL=SvgBuilder.d.ts.map