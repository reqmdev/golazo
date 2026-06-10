/**
 * Cloud hosts (Render, Railway, Fly) inject PORT.
 * Golazo also supports GOLAZO_HEALTH_PORT for explicit control.
 */
function resolveHealthPort() {
    const explicit = Number(process.env.GOLAZO_HEALTH_PORT);
    const platform = Number(process.env.PORT);

    if (explicit > 0) {
        return explicit;
    }

    if (platform > 0) {
        return platform;
    }

    return 0;
}

module.exports = { resolveHealthPort };