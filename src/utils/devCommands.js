/**
 * Developer-only commands (/eval, /admin, /reload) are excluded from
 * registration unless explicitly enabled.
 */
function isDevCommandsEnabled() {
    return process.env.GOLAZO_ENABLE_DEV_COMMANDS === 'true'
        || process.env.GOLAZO_DEV_MODE === 'true';
}

/** @type {Set<string>} */
const DEV_COMMAND_NAMES = new Set(['eval', 'admin', 'reload']);

/**
 * @param {string} commandName
 * @returns {boolean}
 */
function isDevCommandName(commandName) {
    return DEV_COMMAND_NAMES.has(commandName);
}

module.exports = {
    isDevCommandsEnabled,
    isDevCommandName,
    DEV_COMMAND_NAMES,
};