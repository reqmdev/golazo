const path = require('path');
const fs = require('fs');
const { GlobalFonts } = require('@napi-rs/canvas');

let initialized = false;

const FONT_SPECS = [
    { file: 'Inter-Bold.woff2', family: 'Golazo' },
    { file: 'Inter-SemiBold.woff2', family: 'Golazo' },
    { file: 'Inter-Medium.woff2', family: 'Golazo' },
    { file: 'Inter-Regular.woff2', family: 'Golazo' },
    { file: 'JetBrainsMono-SemiBold.woff2', family: 'GolazoMono' }
];

const NODE_MODULES_FALLBACKS = [
    { pkg: '@fontsource/inter', file: 'files/inter-latin-700-normal.woff2', family: 'Golazo' },
    { pkg: '@fontsource/inter', file: 'files/inter-latin-600-normal.woff2', family: 'Golazo' },
    { pkg: '@fontsource/inter', file: 'files/inter-latin-500-normal.woff2', family: 'Golazo' },
    { pkg: '@fontsource/inter', file: 'files/inter-latin-400-normal.woff2', family: 'Golazo' },
    { pkg: '@fontsource/jetbrains-mono', file: 'files/jetbrains-mono-latin-600-normal.woff2', family: 'GolazoMono' }
];

const SYSTEM_FALLBACKS = [
    { path: 'C:\\Windows\\Fonts\\segoeui.ttf', family: 'Golazo' },
    { path: 'C:\\Windows\\Fonts\\segoeuib.ttf', family: 'Golazo' },
    { path: 'C:\\Windows\\Fonts\\consola.ttf', family: 'GolazoMono' },
    { path: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', family: 'Golazo' },
    { path: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', family: 'Golazo' },
    { path: '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', family: 'GolazoMono' }
];

function registerFont(filePath, family) {
    try {
        if (fs.existsSync(filePath)) {
            GlobalFonts.registerFromPath(filePath, family);
            return true;
        }
    } catch {
        // fall through
    }

    return false;
}

function resolveNodeModulesFont(pkg, relativeFile) {
    try {
        const pkgRoot = path.dirname(require.resolve(`${pkg}/package.json`));
        return path.join(pkgRoot, relativeFile);
    } catch {
        return null;
    }
}

function ensureFonts() {
    if (initialized) {
        return;
    }

    const assetsDir = path.join(__dirname, '../../../assets/fonts');
    let registered = 0;

    for (const spec of FONT_SPECS) {
        if (registerFont(path.join(assetsDir, spec.file), spec.family)) {
            registered += 1;
        }
    }

    if (registered === 0) {
        for (const fallback of NODE_MODULES_FALLBACKS) {
            const fontPath = resolveNodeModulesFont(fallback.pkg, fallback.file);

            if (fontPath && registerFont(fontPath, fallback.family)) {
                registered += 1;
            }
        }
    }

    if (registered === 0) {
        for (const fallback of SYSTEM_FALLBACKS) {
            registerFont(fallback.path, fallback.family);
        }
    }

    initialized = true;
}

function resetFonts() {
    initialized = false;
}

module.exports = {
    ensureFonts,
    resetFonts
};