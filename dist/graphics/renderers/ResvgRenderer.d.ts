import type { Theme } from '../core/types';
export interface ResvgRenderOptions {
    width: number;
    height: number;
    theme: Theme;
    scale?: number;
}
export declare function renderSvgToPng(svg: string, options: ResvgRenderOptions): Buffer;
//# sourceMappingURL=ResvgRenderer.d.ts.map