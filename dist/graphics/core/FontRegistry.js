"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFontRegistry = getFontRegistry;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
    fontFiles = null;
    projectRoot() {
        return path.join(__dirname, '..', '..', '..');
    }
    getFontFiles() {
        if (this.fontFiles)
            return this.fontFiles;
        const resolved = [];
        const fontsDir = path.join(this.projectRoot(), 'src', 'assets', 'fonts');
        for (const file of FONT_FILES) {
            const full = path.join(fontsDir, file);
            if (fs.existsSync(full))
                resolved.push(full);
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
    buildFontFaceCss() {
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
            if (!fs.existsSync(path.join(fontsDir, file)))
                return '';
            return `@font-face{font-family:'${family}';src:url('file:///${full}');font-weight:${weight};font-style:normal;}`;
        })
            .filter(Boolean)
            .join('');
    }
}
let registry = null;
function getFontRegistry() {
    if (!registry)
        registry = new FontRegistryImpl();
    return registry;
}
//# sourceMappingURL=FontRegistry.js.map