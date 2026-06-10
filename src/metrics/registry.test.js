const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    incrementCounter,
    setGauge,
    resetMetrics,
    renderPrometheus
} = require('./registry');

describe('metrics registry', () => {
    it('renders counters and gauges in Prometheus text format', () => {
        resetMetrics();
        incrementCounter('golazo_interactions_total', 2);
        setGauge('golazo_guilds', 5);

        const body = renderPrometheus();

        assert.match(body, /golazo_interactions_total 2/);
        assert.match(body, /golazo_guilds 5/);
        assert.match(body, /# TYPE golazo_interactions_total counter/);
        assert.match(body, /# TYPE golazo_guilds gauge/);
    });
});