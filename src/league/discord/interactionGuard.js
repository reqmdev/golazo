const config = require('../../config');
const { LruMap } = require('../../utils/lruMap');

const SEEN_TTL_MS = 60_000;

/** @type {LruMap} */
const seenInteractions = new LruMap({
    maxSize: config.cache?.interactionGuardMaxEntries || 10_000,
    defaultTtlMs: SEEN_TTL_MS
});

/**
 * @param {string} interactionId
 */
function isDuplicateInteraction(interactionId) {
    seenInteractions.sweepExpired();
    return seenInteractions.has(interactionId);
}

/**
 * @param {string} interactionId
 */
function markInteractionHandled(interactionId) {
    seenInteractions.set(interactionId, true, { ttlMs: SEEN_TTL_MS });
}

function clearInteractionGuard() {
    seenInteractions.clear();
}

function sweepExpired() {
    return seenInteractions.sweepExpired();
}

module.exports = {
    isDuplicateInteraction,
    markInteractionHandled,
    clearInteractionGuard,
    sweepExpired
};