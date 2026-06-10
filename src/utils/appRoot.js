const fs = require('fs');
const path = require('path');

let cachedRoot = null;

/**
 * Walk upward until package.json is found (works in /home/container or nested zip folders).
 * @param {string} startDir
 */
function findPackageRoot(startDir) {
    let dir = path.resolve(startDir);

    while (true) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }

        const parent = path.dirname(dir);
        if (parent === dir) {
            return path.resolve(startDir);
        }

        dir = parent;
    }
}

function getAppRoot() {
    if (!cachedRoot) {
        cachedRoot = findPackageRoot(path.join(__dirname, '..', '..'));
    }

    return cachedRoot;
}

/**
 * Ensure process.cwd() matches the folder that contains package.json.
 */
function ensureAppRoot() {
    const root = getAppRoot();

    if (process.cwd() !== root) {
        process.chdir(root);
    }

    return root;
}

/**
 * @param {...string} segments
 */
function appPath(...segments) {
    return path.join(getAppRoot(), ...segments);
}

module.exports = {
    findPackageRoot,
    getAppRoot,
    ensureAppRoot,
    appPath
};