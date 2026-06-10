/**
 * Clears Node's require cache for modules whose resolved path contains `subpath`.
 * Used by hot-reload so updated command/component/event files are re-read from disk.
 * @param {string} subpath e.g. '/src/commands/'
 */
function clearModuleCache(subpath) {
    const normalized = subpath.replace(/\\/g, '/');

    for (const key of Object.keys(require.cache)) {
        if (key.replace(/\\/g, '/').includes(normalized)) {
            delete require.cache[key];
        }
    }
}

module.exports = { clearModuleCache };