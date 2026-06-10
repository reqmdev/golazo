import * as fs from 'fs';
import * as path from 'path';

const FONT_FILES = [
  'Inter-Regular.ttf',
  'Inter-Medium.ttf',
  'Inter-SemiBold.ttf',
  'Inter-Bold.ttf',
  'JetBrainsMono-SemiBold.ttf',
];

const SYSTEM_FONT_DIRS = [
  'C:\\Windows\\Fonts',
  '/usr/share/fonts/truetype/dejavu',
  '/usr/share/fonts/truetype/liberation',
  '/System/Library/Fonts/Supplemental',
];

class FontRegistryImpl {
  private fontFiles: string[] | null = null;

  private projectRoot(): string {
    return path.join(__dirname, '..', '..', '..');
  }

  getFontFiles(): string[] {
    if (this.fontFiles) return this.fontFiles;

    const resolved: string[] = [];
    const fontsDir = path.join(this.projectRoot(), 'src', 'assets', 'fonts');

    for (const file of FONT_FILES) {
      const full = path.join(fontsDir, file);
      if (fs.existsSync(full)) resolved.push(full);
    }

    if (resolved.length === 0) {
      for (const dir of SYSTEM_FONT_DIRS) {
        if (fs.existsSync(dir)) {
          for (const file of fs.readdirSync(dir)) {
            if (file.endsWith('.ttf') || file.endsWith('.otf')) {
              resolved.push(path.join(dir, file));
            }
          }
        }
      }
    }

    this.fontFiles = resolved;
    return resolved;
  }

  getResvgFontOptions() {
    const fontFiles = this.getFontFiles();
    return {
      fontFiles,
      loadSystemFonts: true,
      defaultFontFamily: 'Golazo',
      sansSerifFamily: 'Golazo',
      monospaceFamily: 'GolazoMono',
    };
  }

  buildFontFaceCss(): string {
    const fontsDir = path.join(this.projectRoot(), 'src', 'assets', 'fonts');
    const faces = [
      { file: 'Inter-Regular.ttf', weight: 400 },
      { file: 'Inter-Medium.ttf', weight: 500 },
      { file: 'Inter-SemiBold.ttf', weight: 600 },
      { file: 'Inter-Bold.ttf', weight: 700 },
      { file: 'JetBrainsMono-SemiBold.ttf', weight: 600, family: 'GolazoMono' },
    ];

    return faces
      .map(({ file, weight, family = 'Golazo' }) => {
        const full = path.join(fontsDir, file).replace(/\\/g, '/');
        if (!fs.existsSync(path.join(fontsDir, file))) return '';
        return `@font-face{font-family:'${family}';src:url('file:///${full}');font-weight:${weight};font-style:normal;}`;
      })
      .filter(Boolean)
      .join('');
  }
}

let registry: FontRegistryImpl | null = null;

export function getFontRegistry(): FontRegistryImpl {
  if (!registry) registry = new FontRegistryImpl();
  return registry;
}