export declare const typeScale: {
    readonly display: {
        readonly size: 32;
        readonly weight: 700;
        readonly family: "Golazo";
        readonly lineHeight: 1.05;
    };
    readonly title: {
        readonly size: 20;
        readonly weight: 700;
        readonly family: "Golazo";
        readonly lineHeight: 1.15;
    };
    readonly subtitle: {
        readonly size: 14;
        readonly weight: 600;
        readonly family: "Golazo";
        readonly lineHeight: 1.25;
    };
    readonly body: {
        readonly size: 14;
        readonly weight: 500;
        readonly family: "Golazo";
        readonly lineHeight: 1.35;
    };
    readonly bodySm: {
        readonly size: 13;
        readonly weight: 500;
        readonly family: "Golazo";
        readonly lineHeight: 1.3;
    };
    readonly caption: {
        readonly size: 12;
        readonly weight: 500;
        readonly family: "Golazo";
        readonly lineHeight: 1.3;
    };
    readonly chip: {
        readonly size: 11;
        readonly weight: 600;
        readonly family: "Golazo";
        readonly lineHeight: 1.2;
    };
    readonly micro: {
        readonly size: 10;
        readonly weight: 700;
        readonly family: "Golazo";
        readonly lineHeight: 1.15;
    };
    readonly overline: {
        readonly size: 10;
        readonly weight: 700;
        readonly family: "Golazo";
        readonly lineHeight: 1.1;
    };
    readonly stat: {
        readonly size: 13;
        readonly weight: 700;
        readonly family: "GolazoMono";
        readonly lineHeight: 1.1;
    };
    readonly statLg: {
        readonly size: 16;
        readonly weight: 700;
        readonly family: "GolazoMono";
        readonly lineHeight: 1.1;
    };
    readonly scoreMd: {
        readonly size: 22;
        readonly weight: 700;
        readonly family: "GolazoMono";
        readonly lineHeight: 1;
    };
    readonly scoreLg: {
        readonly size: 40;
        readonly weight: 700;
        readonly family: "GolazoMono";
        readonly lineHeight: 1;
    };
    readonly scoreXl: {
        readonly size: 56;
        readonly weight: 700;
        readonly family: "GolazoMono";
        readonly lineHeight: 0.92;
    };
    readonly stepActive: {
        readonly size: 14;
        readonly weight: 700;
        readonly family: "Golazo";
        readonly lineHeight: 1;
    };
    readonly stepIdle: {
        readonly size: 13;
        readonly weight: 600;
        readonly family: "Golazo";
        readonly lineHeight: 1;
    };
    readonly watermark: {
        readonly size: 11;
        readonly weight: 500;
        readonly family: "Golazo";
        readonly lineHeight: 1;
    };
};
export type TypeVariant = keyof typeof typeScale;
export declare const textStyles: {
    readonly headingLg: "display";
    readonly headingMd: "title";
    readonly body: "body";
    readonly label: "caption";
    readonly statValue: "stat";
    readonly statLabel: "micro";
    readonly scoreLg: "scoreLg";
    readonly scoreMd: "scoreMd";
    readonly overline: "overline";
};
export declare function buildTypographyCss(): string;
//# sourceMappingURL=styles.d.ts.map