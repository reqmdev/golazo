const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { InteractionRateLimiter } = require('./interactionRateLimit');

describe('InteractionRateLimiter', () => {
    it('allows requests within the window', () => {
        const limiter = new InteractionRateLimiter({ maxRequests: 3, windowMs: 10_000 });

        assert.equal(limiter.check('user-1', 'render').allowed, true);
        assert.equal(limiter.check('user-1', 'render').allowed, true);
        assert.equal(limiter.check('user-1', 'render').allowed, true);
        assert.equal(limiter.check('user-1', 'render').allowed, false);
    });

    it('isolates namespaces per user', () => {
        const limiter = new InteractionRateLimiter({ maxRequests: 1, windowMs: 10_000 });

        assert.equal(limiter.check('user-1', 'dashboard').allowed, true);
        assert.equal(limiter.check('user-1', 'score').allowed, true);
        assert.equal(limiter.check('user-1', 'dashboard').allowed, false);
    });

    it('handles 50 concurrent checks on one namespace', async () => {
        const limiter = new InteractionRateLimiter({ maxRequests: 25, windowMs: 60_000 });

        const results = await Promise.all(
            Array.from({ length: 50 }, () =>
                Promise.resolve().then(() => limiter.check('load-user', 'score'))
            )
        );

        const denied = results.filter((result) => !result.allowed).length;
        const allowed = results.filter((result) => result.allowed).length;

        assert.equal(denied + allowed, 50);
        assert.equal(allowed, 25);
        assert.equal(denied, 25);
    });
});