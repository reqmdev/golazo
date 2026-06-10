import { resolveTheme } from '../utils/theme';
import type { RenderResult, Theme } from '../core/types';
interface RendererOptions {
    themeId?: string;
    accentColor?: string;
}
declare abstract class SvgRendererBase {
    protected theme: Theme;
    constructor(options?: RendererOptions);
    abstract render(view: unknown): Promise<RenderResult>;
}
export declare function createSvgRenderer(type: string, options?: RendererOptions): SvgRendererBase;
export declare function shouldUseSvgEngine(type: string, config: {
    engine?: string;
    svgCards?: string[];
}): boolean;
export declare function renderHelpFooterSvg(input: {
    pageId: string;
    heroTitle: string;
    heroSubtitle: string;
    brandLabel: string;
    accent: string;
}): Promise<Buffer>;
export declare function renderBrandMarkSvg(): Promise<Buffer>;
export { resolveTheme };
//# sourceMappingURL=index.d.ts.map