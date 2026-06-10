#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { getAppRoot } = require('../src/utils/appRoot');
const root = getAppRoot();
const distMarker = path.join(root, 'dist', 'graphics', 'adapters', 'index.js');
const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const tscLib = path.join(root, 'node_modules', 'typescript', 'lib', '_tsc.js');
const tsConfig = path.join(root, 'tsconfig.graphics.json');

const MIN_TSC_LIB_BYTES = 1_000_000;

function distReady() {
    return fs.existsSync(distMarker);
}

function typescriptReady() {
    if (!fs.existsSync(tscBin) || !fs.existsSync(tscLib)) {
        return false;
    }

    return fs.statSync(tscLib).size >= MIN_TSC_LIB_BYTES;
}

if (distReady()) {
    console.log('[build-graphics] dist/graphics already present — skipping compile');
    process.exit(0);
}

if (!typescriptReady()) {
    console.error('[build-graphics] TypeScript is missing or incomplete (common after interrupted npm install).');
    console.error('[build-graphics] On the server: stop the bot, delete node_modules, run npm install once, then start with: node .');
    console.error('[build-graphics] Or use the latest GitHub zip — it includes pre-built dist/graphics.');
    process.exit(1);
}

const result = spawnSync(process.execPath, [tscBin, '-p', tsConfig], {
    cwd: root,
    stdio: 'inherit'
});

process.exit(result.status ?? 1);