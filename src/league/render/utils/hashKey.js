const crypto = require('crypto');

/**
 * Stable cache key from serializable parts.
 * @param {string} namespace
 * @param {unknown} payload
 */
function hashKey(namespace, payload) {
    const json = JSON.stringify(payload);
    return `${namespace}:${crypto.createHash('sha256').update(json).digest('hex').slice(0, 24)}`;
}

module.exports = { hashKey };