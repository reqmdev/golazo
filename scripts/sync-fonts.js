const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'fonts');

function ensureEntryShim() {
    const entryPath = path.join(ROOT, 'index.js');

    if (!fs.existsSync(entryPath)) {
        fs.writeFileSync(entryPath, "require('./src/index.js');\n", 'utf8');
        console.log('[sync-fonts] created index.js (bot hosting entry shim)');
    }
}

const FONT_SOURCES = [
    {
        package: '@fontsource/inter',
        files: [
            ['files/inter-latin-400-normal.woff2', 'Inter-Regular.woff2'],
            ['files/inter-latin-500-normal.woff2', 'Inter-Medium.woff2'],
            ['files/inter-latin-600-normal.woff2', 'Inter-SemiBold.woff2'],
            ['files/inter-latin-700-normal.woff2', 'Inter-Bold.woff2']
        ]
    },
    {
        package: '@fontsource/jetbrains-mono',
        files: [
            ['files/jetbrains-mono-latin-600-normal.woff2', 'JetBrainsMono-SemiBold.woff2']
        ]
    }
];

const TTF_DOWNLOADS = [
    {
        url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter_18pt-Regular.ttf',
        dest: 'Inter-Regular.ttf'
    },
    {
        url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter_18pt-Medium.ttf',
        dest: 'Inter-Medium.ttf'
    },
    {
        url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter_18pt-SemiBold.ttf',
        dest: 'Inter-SemiBold.ttf'
    },
    {
        url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter_18pt-Bold.ttf',
        dest: 'Inter-Bold.ttf'
    },
    {
        url: 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-SemiBold.ttf',
        dest: 'JetBrainsMono-SemiBold.ttf'
    }
];

function resolvePackageDir(packageName) {
    const pkgJson = require.resolve(`${packageName}/package.json`);
    return path.dirname(pkgJson);
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                fs.unlinkSync(destPath);
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => {});
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => file.close(() => resolve(destPath)));
        }).on('error', (err) => {
            file.close();
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
}

const WINDOWS_TTF_FALLBACKS = [
    ['C:\\Windows\\Fonts\\segoeui.ttf', 'Inter-Regular.ttf'],
    ['C:\\Windows\\Fonts\\segoeui.ttf', 'Inter-Medium.ttf'],
    ['C:\\Windows\\Fonts\\segoeuib.ttf', 'Inter-SemiBold.ttf'],
    ['C:\\Windows\\Fonts\\segoeuib.ttf', 'Inter-Bold.ttf'],
    ['C:\\Windows\\Fonts\\consolab.ttf', 'JetBrainsMono-SemiBold.ttf']
];

const UNIX_TTF_FALLBACKS = [
    ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'Inter-Regular.ttf'],
    ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'Inter-Medium.ttf'],
    ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'Inter-SemiBold.ttf'],
    ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'Inter-Bold.ttf'],
    ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'JetBrainsMono-SemiBold.ttf']
];

function copyFallbackTtf(src, destName) {
    const dest = path.join(OUT_DIR, destName);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
        return false;
    }

    if (!fs.existsSync(src)) {
        return false;
    }

    fs.copyFileSync(src, dest);
    return true;
}

function syncFallbackTtf() {
    let copied = 0;
    const fallbacks = process.platform === 'win32' ? WINDOWS_TTF_FALLBACKS : UNIX_TTF_FALLBACKS;

    for (const [src, destName] of fallbacks) {
        if (copyFallbackTtf(src, destName)) {
            copied += 1;
        }
    }

    return copied;
}

async function syncTtfFonts() {
    let downloaded = 0;

    for (const item of TTF_DOWNLOADS) {
        const dest = path.join(OUT_DIR, item.dest);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            continue;
        }

        try {
            await downloadFile(item.url, dest);
            downloaded += 1;
        } catch (err) {
            console.warn(`[sync-fonts] TTF download failed for ${item.dest}: ${err.message}`);
        }
    }

    const fallbackCopied = syncFallbackTtf();
    return downloaded + fallbackCopied;
}

async function syncFonts() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    let copied = 0;

    for (const source of FONT_SOURCES) {
        const packageDir = resolvePackageDir(source.package);

        for (const [relativeSrc, destName] of source.files) {
            const src = path.join(packageDir, relativeSrc);
            const dest = path.join(OUT_DIR, destName);

            if (!fs.existsSync(src)) {
                console.warn(`[sync-fonts] missing: ${src}`);
                continue;
            }

            fs.copyFileSync(src, dest);
            copied += 1;
        }
    }

    const ttfCount = await syncTtfFonts();
    console.log(`[sync-fonts] copied ${copied} woff2 file(s), synced ${ttfCount} ttf file(s) to ${OUT_DIR}`);
}

ensureEntryShim();

syncFonts().catch((err) => {
    console.error('[sync-fonts] failed:', err);
    process.exitCode = 1;
});