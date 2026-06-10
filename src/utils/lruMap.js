/**
 * Bounded LRU map with optional per-entry TTL.
 * Map insertion order is used for eviction (oldest = first key).
 */
class LruMap {
    /**
     * @param {{ maxSize?: number, defaultTtlMs?: number | null }} [options]
     */
    constructor(options = {}) {
        this.maxSize = Math.max(1, options.maxSize ?? 1000);
        this.defaultTtlMs = options.defaultTtlMs ?? null;
        /** @type {Map<string, { value: unknown, expiresAt: number | null }>} */
        this._entries = new Map();
    }

    get size() {
        return this._entries.size;
    }

    /**
     * @param {string} key
     */
    has(key) {
        const entry = this._entries.get(key);

        if (!entry) {
            return false;
        }

        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this._entries.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Read without refreshing LRU position.
     * @param {string} key
     */
    peek(key) {
        const entry = this._entries.get(key);

        if (!entry) {
            return undefined;
        }

        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this._entries.delete(key);
            return undefined;
        }

        return entry.value;
    }

    /**
     * @param {string} key
     */
    get(key) {
        const entry = this._entries.get(key);

        if (!entry) {
            return undefined;
        }

        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this._entries.delete(key);
            return undefined;
        }

        // Refresh LRU position
        this._entries.delete(key);
        this._entries.set(key, entry);

        return entry.value;
    }

    /**
     * @param {string} key
     * @param {unknown} value
     * @param {{ ttlMs?: number | null }} [options]
     */
    set(key, value, options = {}) {
        if (this._entries.has(key)) {
            this._entries.delete(key);
        }

        const ttlMs = options.ttlMs !== undefined ? options.ttlMs : this.defaultTtlMs;
        const expiresAt = ttlMs ? Date.now() + ttlMs : null;

        this._entries.set(key, { value, expiresAt });
        this._evictOverflow();
    }

    /**
     * @param {string} key
     */
    delete(key) {
        return this._entries.delete(key);
    }

    clear() {
        this._entries.clear();
    }

    /**
     * Remove expired entries. Returns count removed.
     */
    sweepExpired() {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this._entries.entries()) {
            if (entry.expiresAt !== null && entry.expiresAt <= now) {
                this._entries.delete(key);
                removed++;
            }
        }

        return removed;
    }

    /**
     * @returns {IterableIterator<string>}
     */
    keys() {
        return this._entries.keys();
    }

    _evictOverflow() {
        while (this._entries.size > this.maxSize) {
            const oldest = this._entries.keys().next().value;

            if (oldest === undefined) {
                break;
            }

            this._entries.delete(oldest);
        }
    }
}

module.exports = { LruMap };