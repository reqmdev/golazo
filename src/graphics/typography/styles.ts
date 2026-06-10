export const typeScale = {
  display: { size: 32, weight: 700, family: 'Golazo', lineHeight: 1.05 },
  title: { size: 20, weight: 700, family: 'Golazo', lineHeight: 1.15 },
  subtitle: { size: 14, weight: 600, family: 'Golazo', lineHeight: 1.25 },
  body: { size: 14, weight: 500, family: 'Golazo', lineHeight: 1.35 },
  bodySm: { size: 13, weight: 500, family: 'Golazo', lineHeight: 1.3 },
  caption: { size: 12, weight: 500, family: 'Golazo', lineHeight: 1.3 },
  chip: { size: 11, weight: 600, family: 'Golazo', lineHeight: 1.2 },
  micro: { size: 10, weight: 700, family: 'Golazo', lineHeight: 1.15 },
  overline: { size: 10, weight: 700, family: 'Golazo', lineHeight: 1.1 },
  stat: { size: 13, weight: 700, family: 'GolazoMono', lineHeight: 1.1 },
  statLg: { size: 16, weight: 700, family: 'GolazoMono', lineHeight: 1.1 },
  scoreMd: { size: 22, weight: 700, family: 'GolazoMono', lineHeight: 1 },
  scoreLg: { size: 40, weight: 700, family: 'GolazoMono', lineHeight: 1 },
  scoreXl: { size: 56, weight: 700, family: 'GolazoMono', lineHeight: 0.92 },
  stepActive: { size: 14, weight: 700, family: 'Golazo', lineHeight: 1 },
  stepIdle: { size: 13, weight: 600, family: 'Golazo', lineHeight: 1 },
  watermark: { size: 11, weight: 500, family: 'Golazo', lineHeight: 1 },
} as const;

export type TypeVariant = keyof typeof typeScale;

export const textStyles = {
  headingLg: 'display',
  headingMd: 'title',
  body: 'body',
  label: 'caption',
  statValue: 'stat',
  statLabel: 'micro',
  scoreLg: 'scoreLg',
  scoreMd: 'scoreMd',
  overline: 'overline',
} as const;

export function buildTypographyCss(): string {
  const rules: string[] = [];

  for (const [name, spec] of Object.entries(typeScale)) {
    rules.push(
      `.${name}{font-family:'${spec.family}',sans-serif;font-size:${spec.size}px;font-weight:${spec.weight};line-height:${spec.lineHeight}}`,
    );
  }

  rules.push('.tabular{font-variant-numeric:tabular-nums}');
  rules.push('.uppercase{text-transform:uppercase;letter-spacing:0.06em}');
  return rules.join('');
}