export interface Theme {
    id: string;
    canvas: string;
    surface: string;
    surfaceRaised: string;
    surfaceHover: string;
    border: string;
    borderSubtle: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentMuted: string;
    accentSoft: string;
    success: string;
    warning: string;
    danger: string;
    win: string;
    draw: string;
    loss: string;
    rankGold: string;
    rankSilver: string;
    rankBronze: string;
    shadow: string;
}
export interface RenderResult {
    buffer: Buffer;
    filename: string;
    meta?: Record<string, unknown>;
}
export interface PipelineOptions {
    width: number;
    height: number;
    theme: Theme;
    scale?: number;
    backgroundVariant?: 'data' | 'hero';
    composites?: CompositeLayer[];
}
export interface CompositeLayer {
    input: Buffer;
    left?: number;
    top?: number;
    blend?: 'over' | 'multiply' | 'screen';
    opacity?: number;
}
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
//# sourceMappingURL=types.d.ts.map