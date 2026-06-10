const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const entryPath = path.join(root, 'index.js');
const shim = "require('./src/index.js');\n";

if (!fs.existsSync(entryPath)) {
    fs.writeFileSync(entryPath, shim, 'utf8');
    console.log('[ensure-entry] created missing index.js for bot hosting panels');
}