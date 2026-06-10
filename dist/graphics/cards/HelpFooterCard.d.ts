import type { RenderResult, Theme } from '../core/types';
export interface HelpFooterInput {
    pageId: string;
    heroTitle: string;
    heroSubtitle: string;
    brandLabel: string;
    accent: string;
}
export declare function renderHelpFooterCard(input: HelpFooterInput, theme: Theme): Promise<Buffer>;
export declare function renderBrandMarkCard(theme: Theme): Promise<Buffer>;
export declare function renderHelpFooterResult(input: HelpFooterInput, theme: Theme): Promise<RenderResult>;
//# sourceMappingURL=HelpFooterCard.d.ts.map