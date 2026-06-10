const fs = require('fs');
const path = require('path');
const { createTranslator, SUPPORTED_LOCALES } = require('../src/i18n');
const { HELP_PAGE_IDS } = require('../src/help/constants');
const { regenerateAllHelpAssets } = require('../src/help/renderHelpAssets');
const { ASSETS_ROOT } = require('../src/canvas/loadAsset');

const dirs = [
    path.join(ASSETS_ROOT, 'backgrounds'),
    path.join(ASSETS_ROOT, 'brand'),
    path.join(ASSETS_ROOT, 'icons'),
    path.join(ASSETS_ROOT, 'cache')
];

for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
}

regenerateAllHelpAssets(
    SUPPORTED_LOCALES,
    (locale) => createTranslator(locale),
    HELP_PAGE_IDS
).then(() => {
    console.log(`Canvas asset dirs ready under ${ASSETS_ROOT}`);
    console.log(`Help footer previews cached for locales: ${SUPPORTED_LOCALES.join(', ')}`);
    console.log('Optional bitmaps: backgrounds/stadium-modern.png, backgrounds/help-bar-modern.png, brand/golazo-mark.png');
}).catch((error) => {
    console.error(error);
    process.exit(1);
});