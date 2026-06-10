const fs = require('fs');
const path = require('path');
const { getAppRoot } = require('../src/utils/appRoot');

const ENTRY_SHIM = [
    "require('./src/utils/appRoot').ensureAppRoot();",
    "require('./src/index.js');",
    ''
].join('\n');

function ensureEntryShim() {
    const root = getAppRoot();
    const entryPath = path.join(root, 'index.js');
    const current = fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';

    if (current !== ENTRY_SHIM) {
        fs.writeFileSync(entryPath, ENTRY_SHIM, 'utf8');
        console.log('[ensure-entry] wrote index.js hosting entry shim');
    }
}

if (require.main === module) {
    ensureEntryShim();
}

module.exports = { ensureEntryShim, ENTRY_SHIM };