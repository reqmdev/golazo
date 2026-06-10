const LeagueError = require('../errors/LeagueError');
const { AUDIT_ACTION } = require('../constants/auditAction');
const { LEAGUE_STATUS } = require('../constants/leagueStatus');
const AuditService = require('./AuditService');
const { LEAGUE_FORMAT, DEFAULT_LEAGUE_FORMAT } = require('../constants/leagueFormat');
const { MAX_LEAGUES_PER_GUILD } = require('../constants/defaults');
const { slugify } = require('../utils/slugify');
const LeagueRepository = require('../repositories/LeagueRepository');

const LeagueService = {
    /**
     * Resolves a league by guild + slug. Throws if not found.
     * @param {string} guildId
     * @param {string} slug
     */
    resolveLeague: async (guildId, slug) => {
        const normalizedSlug = slug.trim().toLowerCase();

        if (!normalizedSlug) {
            throw new LeagueError('INVALID_SLUG_EMPTY');
        }

        const league = await LeagueRepository.findByGuildAndSlug(guildId, normalizedSlug);

        if (!league) {
            throw new LeagueError('LEAGUE_NOT_FOUND', { slug: normalizedSlug });
        }

        return league;
    },

    /**
     * @param {string} guildId
     * @param {string} userId
     * @param {{ name: string, slug?: string, format?: string }} input
     */
    createLeague: async (guildId, userId, input) => {
        const name = input.name?.trim();

        if (!name || name.length < 2) {
            throw new LeagueError('INVALID_NAME_MIN');
        }

        if (name.length > 64) {
            throw new LeagueError('INVALID_NAME_MAX');
        }

        const leagueCount = await LeagueRepository.countByGuild(guildId);

        if (leagueCount >= MAX_LEAGUES_PER_GUILD) {
            throw new LeagueError('LEAGUE_LIMIT', { max: MAX_LEAGUES_PER_GUILD });
        }

        const slug = (input.slug?.trim() ? slugify(input.slug) : slugify(name));

        if (!slug) {
            throw new LeagueError('INVALID_SLUG_GENERATE');
        }

        const existing = await LeagueRepository.findByGuildAndSlug(guildId, slug);

        if (existing) {
            throw new LeagueError('SLUG_EXISTS', { slug });
        }

        const format = input.format || DEFAULT_LEAGUE_FORMAT;

        if (!Object.values(LEAGUE_FORMAT).includes(format)) {
            throw new LeagueError('INVALID_FORMAT');
        }

        try {
            const league = await LeagueRepository.create({
                guildId,
                slug,
                name,
                format,
                status: LEAGUE_STATUS.REGISTRATION,
                permissions: {
                    ownerId: userId,
                    adminIds: [],
                    scoreReporterIds: []
                },
                createdBy: userId
            });

            await AuditService.record({
                leagueId: league._id,
                guildId,
                actorId: userId,
                action: AUDIT_ACTION.LEAGUE_CREATE,
                summary: `League created: ${name} (\`${slug}\`)`
            });

            return league;
        } catch (err) {
            if (err?.code === 11000) {
                throw new LeagueError('SLUG_EXISTS', { slug });
            }

            throw err;
        }
    },

    /**
     * @param {string} guildId
     */
    listLeagues: async (guildId) => {
        return LeagueRepository.listByGuild(guildId);
    }
};

module.exports = LeagueService;