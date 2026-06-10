const AuditRepository = require('../repositories/AuditRepository');

const AuditService = {
    /**
     * Fire-and-forget audit entry — never throws to caller.
     *
     * @param {{ leagueId: import('mongoose').Types.ObjectId | string, guildId: string, actorId: string, action: string, summary: string, metadata?: object }} entry
     */
    record: async (entry) => {
        try {
            await AuditRepository.create({
                leagueId: entry.leagueId,
                guildId: entry.guildId,
                actorId: entry.actorId,
                action: entry.action,
                summary: entry.summary.slice(0, 512),
                metadata: entry.metadata ?? null
            });
        } catch (err) {
            console.warn('[golazo] audit record failed:', err?.message || err);
        }
    },

    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     * @param {{ limit?: number }} [options]
     */
    listForLeague: async (leagueId, { limit = 10 } = {}) => {
        const capped = Math.min(Math.max(limit, 1), 25);
        return AuditRepository.listByLeague(leagueId, { limit: capped });
    }
};

module.exports = AuditService;