/**
 * Lightweight Prometheus-style metrics (text exposition format).
 */

/** @type {Map<string, number>} */
const counters = new Map();

/** @type {Map<string, number>} */
const gauges = new Map();

/**
 * @param {string} name
 * @param {number} [delta]
 */
function incrementCounter(name, delta = 1) {
    counters.set(name, (counters.get(name) || 0) + delta);
}

/**
 * @param {string} name
 * @param {number} value
 */
function setGauge(name, value) {
    gauges.set(name, value);
}

function resetMetrics() {
    counters.clear();
    gauges.clear();
}

/**
 * @returns {string}
 */
function renderPrometheus() {
    const lines = [];

    for (const [name, value] of counters.entries()) {
        lines.push(`# TYPE ${name} counter`);
        lines.push(`${name} ${value}`);
    }

    for (const [name, value] of gauges.entries()) {
        lines.push(`# TYPE ${name} gauge`);
        lines.push(`${name} ${value}`);
    }

    return `${lines.join('\n')}\n`;
}

module.exports = {
    incrementCounter,
    setGauge,
    resetMetrics,
    renderPrometheus
};