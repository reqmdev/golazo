#!/usr/bin/env node
/**
 * One-shot fix for Bot-Hosting servers stuck on old files.
 * Run on the server: node scripts/patch-bot-hosting.js
 * Or: curl -sL .../patch-bot-hosting.js | node
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function patch(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log(`[skip] missing ${filePath}`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const [from, to] of replacements) {
        if (content.includes(from)) {
            content = content.split(from).join(to);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[ok] patched ${path.relative(root, filePath)}`);
    } else {
        console.log(`[ok] already up to date: ${path.relative(root, filePath)}`);
    }

    return true;
}

const indexPath = path.join(root, 'src', 'index.js');
patch(indexPath, [
    [
        'startHealthServer(client).catch',
        'void Promise.resolve(startHealthServer(client)).catch'
    ]
]);

const serverPath = path.join(root, 'src', 'health', 'server.js');
patch(serverPath, [
    [
        `    if (!port || port < 1) {
        return null;
    }`,
        `    if (!port || port < 1) {
        return Promise.resolve(null);
    }`
    ],
    [
        'return null;',
        'return Promise.resolve(null);'
    ]
]);

const { ensureEntryShim } = require('./ensure-entry');
ensureEntryShim();

console.log('[done] Run: node src/index.js');