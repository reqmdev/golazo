class LeagueError extends Error {
    /**
     * @param {string} code Machine-readable error code (maps to errors.{code} in locale files).
     * @param {Record<string, string | number | null | undefined>} [params]
     */
    constructor(code, params = {}) {
        super(code);
        this.name = 'LeagueError';
        this.code = code;
        this.params = params;
    }
}

module.exports = LeagueError;