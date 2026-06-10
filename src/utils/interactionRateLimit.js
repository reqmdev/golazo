const { LruMap } = require('./lruMap');
const { incrementCounter } = require('../metrics/registry');

/**
 * Sliding-window rate limiter for render-heavy component interactions.
 * Keys are `${userId}:${namespace}`.
 */
class InteractionRateLimiter {
    /**
     * @param {{ maxRequests?: number, windowMs?: number, maxKeys?: number }} [options]
     */
    constructor(options = {}) {
        this.maxRequests = Math.max(1, options.maxRequests ?? 12);
        this.windowMs = Math.max(1000, options.windowMs ?? 60_000);
        this._buckets = new LruMap({ maxSize: options.maxKeys ?? 20_000 });
    }

    /**
     * @param {string} userId
     * @param {string} namespace
     * @returns {{ allowed: boolean, retryAfterMs?: number }}
     */
    check(userId, namespace) {
        if (!userId || !namespace) {
            return { allowed: true };
        }

        const key = `${userId}:${namespace}`;
        const now = Date.now();
        const windowStart = now - this.windowMs;

        /** @type {number[]} */
        let timestamps = this._buckets.get(key) || [];
        timestamps = timestamps.filter((ts) => ts > windowStart);

        if (timestamps.length >= this.maxRequests) {
            const oldest = timestamps[0];
            const retryAfterMs = Math.max(0, oldest + this.windowMs - now);

            this._buckets.set(key, timestamps, { ttlMs: this.windowMs * 2 });
            incrementCounter('golazo_render_rate_limited_total');

            return { allowed: false, retryAfterMs };
        }

        timestamps.push(now);
        this._buckets.set(key, timestamps, { ttlMs: this.windowMs * 2 });

        return { allowed: true };
    }

    sweepExpired() {
        return this._buckets.sweepExpired();
    }

    clear() {
        this._buckets.clear();
    }
}

/** @type {InteractionRateLimiter | null} */
let renderLimiter = null;

function getRenderRateLimiter() {
    if (!renderLimiter) {
        const config = require('../config');
        const limits = config.rateLimit?.render || {};

        renderLimiter = new InteractionRateLimiter({
            maxRequests: limits.maxRequests,
            windowMs: limits.windowMs,
            maxKeys: limits.maxKeys
        });
    }

    return renderLimiter;
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {string} namespace
 */
function checkRenderRateLimit(interaction, namespace) {
    if (!interactionRateLimitEnabled()) {
        return { allowed: true };
    }

    const userId = interaction.user?.id;

    if (!userId) {
        return { allowed: true };
    }

    return getRenderRateLimiter().check(userId, namespace);
}

function interactionRateLimitEnabled() {
    const config = require('../config');
    return config.rateLimit?.render?.enabled !== false;
}

function clearRenderRateLimiter() {
    if (renderLimiter) {
        renderLimiter.clear();
    }
}

module.exports = {
    InteractionRateLimiter,
    getRenderRateLimiter,
    checkRenderRateLimit,
    clearRenderRateLimiter,
    interactionRateLimitEnabled
};