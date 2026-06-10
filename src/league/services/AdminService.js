const LeagueError = require('../errors/LeagueError');
const { LEAGUE_STATUS } = require('../constants/leagueStatus');
const { LEAGUE_FORMAT, DEFAULT_LEAGUE_FORMAT } = require('../constants/leagueFormat');
const { DEFAULT_TEAM_LIMITS } = require('../constants/defaults');
const { AUDIT_ACTION } = require('../constants/auditAction');
const LeagueRepository = require('../repositories/LeagueRepository');
const TeamRepository = require('../repositories/TeamRepository');
const MatchRepository = require('../repositories/MatchRepository');
const StandingRepository = require('../repositories/StandingRepository');
const AuditRepository = require('../repositories/AuditRepository');
const FixtureService = require('./FixtureService');
const AuditService = require('./AuditService');
const { invalidateLeagueRenderCache } = require('../discord/cacheInvalidation');

const FAKE_LEAGUE_SLUG = 'fake-lig';
const FAKE_LEAGUE_NAME = 'Fake Lig';

const FAKE_TEAM_NAMES = [
    'Galatasaray',
    'Fenerbahce',
    'Besiktas',
    'Trabzonspor',
    'Basaksehir',
    'Konyaspor',
    'Antalyaspor',
    'Sivasspor',
    'Kasimpasa',
    'Alanyaspor',
    'Rizespor',
    'Gaziantep',
    'Hatayspor',
    'Kayserispor',
    'Adana Demir',
    'Goztepe',
    'Samsunspor',
    'Eyupspor',
    'Bodrum FK',
    'Giresunspor',
];

/** Muted primary/secondary pairs — readable on dark cards, not neon club colors. */
const FAKE_COLORS = [
    ['#5c3d42', '#2a3038'],
    ['#3d4f5c', '#252b33'],
    ['#2f3d34', '#1e2429'],
    ['#4a3f52', '#2c3138'],
    ['#4f4a3a', '#2a2f34'],
    ['#3a4a4f', '#23282e'],
    ['#5a4a3d', '#2b3036'],
    ['#3d4a42', '#252a30'],
    ['#4a3d4a', '#2a2f35'],
    ['#3f4f4a', '#24292f'],
    ['#52443a', '#2c3137'],
    ['#3a4550', '#232830'],
    ['#4d3f3f', '#2a2f34'],
    ['#3d4f44', '#252a2f'],
    ['#4a4458', '#2b3036'],
    ['#45503d', '#272c32'],
    ['#503f4a', '#2a2f35'],
    ['#3f4a50', '#24292e'],
    ['#4a5040', '#282d33'],
    ['#4a3f50', '#2a2f36'],
];

/**
 * @param {import('mongoose').Types.ObjectId | string} leagueId
 */
async function deleteLeagueCascade(leagueId) {
    const id = leagueId.toString();

    await Promise.all([
        MatchRepository.deleteAllByLeague(leagueId),
        StandingRepository.deleteByLeague(leagueId),
        AuditRepository.deleteByLeague(leagueId),
        TeamRepository.deleteByLeague(leagueId),
    ]);

    await LeagueRepository.deleteById(leagueId);
    invalidateLeagueRenderCache(id);
}

/**
 * @param {number} index
 */
function fakeTeamShortName(name, index) {
    const letters = name.replace(/[^A-Za-z]/g, '').toUpperCase();
    return (letters.slice(0, 3) || `T${index}`).slice(0, 4);
}

const AdminService = {
    FAKE_LEAGUE_SLUG,

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {{ teamCount?: number, generateFixture?: boolean }} [options]
     */
    seedFakeLeague: async (guildId, actorId, options = {}) => {
        const maxTeams = DEFAULT_TEAM_LIMITS.maxTeams;
        const teamCount = Math.min(
            Math.max(options.teamCount ?? maxTeams, DEFAULT_TEAM_LIMITS.minTeams),
            maxTeams,
        );

        const existing = await LeagueRepository.findByGuildAndSlug(guildId, FAKE_LEAGUE_SLUG);

        if (existing) {
            await deleteLeagueCascade(existing._id);
        }

        const league = await LeagueRepository.create({
            guildId,
            slug: FAKE_LEAGUE_SLUG,
            name: FAKE_LEAGUE_NAME,
            format: DEFAULT_LEAGUE_FORMAT,
            status: LEAGUE_STATUS.REGISTRATION,
            settings: {
                minTeams: DEFAULT_TEAM_LIMITS.minTeams,
                maxTeams,
            },
            permissions: {
                ownerId: actorId,
                adminIds: [],
                scoreReporterIds: [],
            },
            createdBy: actorId,
        });

        const teams = [];

        for (let index = 0; index < teamCount; index += 1) {
            const name = FAKE_TEAM_NAMES[index] || `Takim ${index + 1}`;
            const [primary, secondary] = FAKE_COLORS[index % FAKE_COLORS.length];

            const team = await TeamRepository.create({
                leagueId: league._id,
                guildId,
                name,
                nameLower: name.toLowerCase(),
                shortName: fakeTeamShortName(name, index + 1),
                captainId: null,
                logoUrl: null,
                colors: { primary, secondary },
                isActive: true,
            });

            teams.push(team);
        }

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.LEAGUE_CREATE,
            summary: `Admin fake league seeded (${teamCount} teams)`,
        });

        let fixture = null;

        if (options.generateFixture !== false) {
            fixture = await FixtureService.generateFixtureUnchecked(guildId, FAKE_LEAGUE_SLUG);
        }

        return {
            league: fixture?.league || league,
            slug: FAKE_LEAGUE_SLUG,
            teamCount: teams.length,
            matchCount: fixture?.matchCount ?? 0,
            totalRounds: fixture?.totalRounds ?? 0,
            fixtureGenerated: Boolean(fixture),
        };
    },

    /**
     * @param {string} guildId
     * @param {{ confirm?: boolean }} [options]
     */
    wipeGuildLeagueData: async (guildId, options = {}) => {
        if (!options.confirm) {
            throw new LeagueError('ADMIN_WIPE_CONFIRM_REQUIRED');
        }

        const leagues = await LeagueRepository.listByGuild(guildId, { includeArchived: true });
        const leagueIds = leagues.map((league) => league._id);

        const [matches, teams, standings, audits, leagueDelete] = await Promise.all([
            MatchRepository.deleteAllByGuild(guildId),
            TeamRepository.deleteAllByGuild(guildId),
            StandingRepository.deleteAllByGuild(guildId),
            AuditRepository.deleteAllByGuild(guildId),
            LeagueRepository.deleteAllByGuild(guildId),
        ]);

        for (const leagueId of leagueIds) {
            invalidateLeagueRenderCache(leagueId.toString());
        }

        return {
            leagues: leagueDelete.deletedCount ?? leagues.length,
            teams: teams.deletedCount ?? 0,
            matches: matches.deletedCount ?? 0,
            standings: standings.deletedCount ?? 0,
            audits: audits.deletedCount ?? 0,
        };
    },
};

module.exports = AdminService;