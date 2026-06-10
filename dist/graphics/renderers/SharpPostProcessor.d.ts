import type { CompositeLayer } from '../core/types';
export declare function postProcessPng(pngBuffer: Buffer, options: {
    width: number;
    height: number;
    scale?: number;
    backgroundVariant?: 'data' | 'hero';
    stadiumBg?: Buffer | null;
    composites?: CompositeLayer[];
}): Promise<Buffer>;
//# sourceMappingURL=SharpPostProcessor.d.ts.map