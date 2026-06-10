/**
 * Periodic sweeper for in-memory caches that expose sweepExpired().
 */

/** @type {Map<string, { interval: NodeJS.Timeout, targets: { sweepExpired: () => number }[] }>} */
const activeSweepers = new Map();

/**
 * @param {string} name
 * @param {{ sweepExpired: () => number }[]} targets
 * @param {number} intervalMs
 */
function startCacheSweeper(name, targets, intervalMs) {
    stopCacheSweeper(name);

    if (!targets.length || intervalMs <= 0) {
        return;
    }

    const interval = setInterval(() => {
        for (const target of targets) {
            try {
                target.sweepExpired?.();
            } catch {
                // best-effort
            }
        }
    }, intervalMs);

    if (typeof interval.unref === 'function') {
        interval.unref();
    }

    activeSweepers.set(name, { interval, targets });
}

/**
 * @param {string} name
 */
function stopCacheSweeper(name) {
    const existing = activeSweepers.get(name);

    if (!existing) {
        return;
    }

    clearInterval(existing.interval);
    activeSweepers.delete(name);
}

function stopAllCacheSweepers() {
    for (const name of [...activeSweepers.keys()]) {
        stopCacheSweeper(name);
    }
}

module.exports = {
    startCacheSweeper,
    stopCacheSweeper,
    stopAllCacheSweepers
};