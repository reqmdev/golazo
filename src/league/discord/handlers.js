const { PermissionFlagsBits } = require('discord.js');
const LeagueError = require('../errors/LeagueError');
const LeagueService = require('../services/LeagueService');
const TeamService = require('../services/TeamService');
const FixtureService = require('../services/FixtureService');
const MatchService = require('../services/MatchService');

const LeagueSettingsService = require('../services/LeagueSettingsService');
const RollbackService = require('../services/RollbackService');
const ResetService = require('../services/ResetService');
const AuditService = require('../services/AuditService');
const PermissionService = require('../services/PermissionService');
const { sendLeagueReply } = require('../utils/discord');

const { formatAuditLog } = require('../utils/formatAudit');
const {
    stripLeagueReplyMeta,
    buildMatchResultV2Reply,
    buildRollbackV2Reply,
} = require('../utils/visualV2Reply');
const { renderMatchVisual, renderStandingsVisual } = require('../utils/visualHelpers');
const { buildTeamMap } = require('../utils/teamMap');
const { send, sendCompact } = require('../../ui/ReplyService');
const { body } = require('../../ui/body');
const { leagueLockKey } = require('./operationLock');
const { LEAGUE_WRITE_SCOPE } = require('./constants');

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
function guildContext(interaction) {
    return {
        guildId: interaction.guild.id,
        actorId: interaction.user.id
    };
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
function leagueSlug(interaction) {
    return interaction.options.getString('league', true);
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleCreate(interaction, ctx) {
    const { tr } = ctx;

    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        await sendCompact(interaction, {
            tr,
            description: tr('handlers.create.permissionDenied'),
            tone: 'warning',
            ephemeral: true
        });
        return;
    }

    const league = await LeagueService.createLeague(interaction.guild.id, interaction.user.id, {
        name: interaction.options.getString('name', true),
        slug: interaction.options.getString('slug') || undefined,
        format: interaction.options.getString('format') || undefined
    });

    await send(interaction, {
        tr,
        variant: 'league',
        titleKey: 'handlers.create.success',
        titleParams: { name: league.name },
        description: body(
            tr('handlers.create.slug', { slug: league.slug }),
            tr('handlers.create.format', { format: league.format }),
            tr('handlers.create.status', { status: league.status }),
            tr('handlers.create.nextStep', { slug: league.slug })
        )
    });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleList(interaction, ctx) {
    const { tr } = ctx;
    const leagues = await LeagueService.listLeagues(interaction.guild.id);

    if (leagues.length === 0) {
        await send(interaction, {
            tr,
            variant: 'league',
            descriptionKey: 'handlers.list.empty'
        });
        return;
    }

    const { uiEmoji } = require('../../ui/emoji');
    const lines = [
        `### ${uiEmoji(tr, 'league')} **${tr('handlers.list.title', { count: leagues.length })}**`,
        '',
        ...leagues.map((league) => tr('handlers.list.itemRich', {
            name: league.name,
            slug: league.slug,
            status: league.status,
            format: league.format,
        })),
        '',
        tr('handlers.list.hint'),
    ];

    await send(interaction, {
        tr,
        variant: 'league',
        description: lines.join('\n'),
    });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} subcommand
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleFixture(interaction, subcommand, ctx) {
    const { locale, tr, client } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);

    if (subcommand === 'generate') {
        const result = await FixtureService.generateFixture(guildId, actorId, slug);

        await send(interaction, {
            tr,
            variant: 'league',
            titleKey: 'handlers.fixture.generate.success',
            titleParams: { name: result.league.name, slug },
            description: body(
                tr('handlers.fixture.generate.stats', {
                    teamCount: result.teamCount,
                    matchCount: result.matchCount,
                    totalRounds: result.totalRounds
                }),
                tr('handlers.fixture.generate.status', { status: result.league.status }),
                tr('handlers.fixture.generate.nextStep', {
                    slug,
                    currentRound: result.league.currentRound
                })
            )
        });
        return;
    }

    if (subcommand === 'show') {
        const { buildFixtureShowPayload } = require('./fixtureNav');
        const payload = await buildFixtureShowPayload({
            guildId,
            slug,
            locale,
            tr,
            client,
        });

        await sendLeagueReply(interaction, stripLeagueReplyMeta(payload));
        return;
    }

    if (subcommand === 'regenerate') {
        const result = await FixtureService.regenerateFixture(guildId, actorId, slug);

        await send(interaction, {
            tr,
            variant: 'league',
            titleKey: 'handlers.fixture.regenerate.success',
            titleParams: { name: result.league.name, slug },
            description: tr('handlers.fixture.regenerate.stats', {
                version: result.league.fixtureVersion,
                matchCount: result.matchCount,
                totalRounds: result.totalRounds
            })
        });
    }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} subcommand
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleTeam(interaction, subcommand, ctx) {
    const { tr } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);

    if (subcommand === 'add') {
        const captain = interaction.options.getUser('captain');
        const role = interaction.options.getRole('role');
        const team = await TeamService.addTeam(guildId, actorId, slug, {
            name: interaction.options.getString('name', true),
            shortName: interaction.options.getString('short_name') || undefined,
            captainId: captain?.id,
            roleId: role?.id,
            primaryColor: interaction.options.getString('primary_color') || undefined,
            logoUrl: interaction.options.getString('logo_url') || undefined
        });

        await send(interaction, {
            tr,
            variant: 'league',
            descriptionKey: 'handlers.team.add.success',
            descriptionParams: {
                name: team.name,
                shortName: team.shortName,
                slug
            },

        });
        return;
    }

    if (subcommand === 'remove') {
        const team = await TeamService.removeTeam(
            guildId,
            actorId,
            slug,
            interaction.options.getString('name', true)
        );

        await send(interaction, {
            tr,
            variant: 'league',
            descriptionKey: 'handlers.team.remove.success',
            descriptionParams: { name: team.name, slug },

        });
        return;
    }

    if (subcommand === 'edit') {
        const captain = interaction.options.getUser('captain');
        const role = interaction.options.getRole('role');
        const editInput = {
            newName: interaction.options.getString('new_name') || undefined,
            shortName: interaction.options.getString('short_name') || undefined,
            primaryColor: interaction.options.getString('primary_color') || undefined,
            logoUrl: interaction.options.getString('logo_url') || undefined
        };

        if (captain) editInput.captainId = captain.id;
        if (role) editInput.roleId = role.id;

        const team = await TeamService.editTeam(
            guildId,
            actorId,
            slug,
            interaction.options.getString('name', true),
            editInput
        );

        await send(interaction, {
            tr,
            variant: 'league',
            descriptionKey: 'handlers.team.edit.success',
            descriptionParams: {
                name: team.name,
                shortName: team.shortName,
                slug
            },

        });
        return;
    }

    if (subcommand === 'list') {
        const { locale, client } = ctx;
        const league = await LeagueService.resolveLeague(guildId, slug);
        const teams = await TeamService.listTeams(guildId, slug);

        if (teams.length === 0) {
            await send(interaction, {
                tr,
                variant: 'league',
                descriptionKey: 'handlers.team.list.empty',
                descriptionParams: { slug },
            });
            return;
        }

        const { buildTeamListShowPayload } = require('./teamListNav');
        const page = interaction.options.getInteger('page') ?? 1;
        const payload = await buildTeamListShowPayload({
            guildId,
            slug,
            page,
            locale,
            tr,
            client,
            guild: interaction.guild,
        });

        await sendLeagueReply(interaction, payload);
    }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleScore(interaction, ctx) {
    const { locale, tr, client } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);

    const league = await LeagueService.resolveLeague(guildId, slug);
    PermissionService.assertCanReportScore(league, actorId);

    if (!league.fixtureGeneratedAt) {
        throw new LeagueError('NO_FIXTURE_SCORE');
    }

    const { buildScoreEntryPayload } = require('./scoreNav');
    const payload = await buildScoreEntryPayload({
        guildId,
        slug,
        round: interaction.options.getInteger('round') ?? undefined,
        locale,
        tr,
        client,
        actorId,
    });

    await sendLeagueReply(interaction, stripLeagueReplyMeta(payload));
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleScoreCorrect(interaction, ctx) {
    const { locale, tr, client } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);

    const result = await MatchService.correctResult(guildId, actorId, slug, {
        homeTeam: interaction.options.getString('home', true),
        awayTeam: interaction.options.getString('away', true),
        homeGoals: interaction.options.getInteger('home_goals', true),
        awayGoals: interaction.options.getInteger('away_goals', true),
        round: interaction.options.getInteger('round') ?? undefined,
        reason: interaction.options.getString('reason') ?? undefined
    });

    const renderResult = await renderMatchVisual(result.league, result.match, {
        locale,
        tr,
        client,
        label: tr('render.matchResult.corrected'),
    });

    const { announceMatchResult } = require('./announcements');
    await announceMatchResult(client, {
        league: result.league,
        match: result.match,
        tr,
        locale,
        kind: 'correct',
    });

    await sendLeagueReply(interaction, buildMatchResultV2Reply({
        tr,
        slug: result.league.slug,
        leagueName: result.league.name,
        round: result.match.round,
        totalRounds: result.league.totalRounds || result.match.round,
        titleKey: 'handlers.scoreCorrect.corrected',
        titleParams: {
            home: interaction.options.getString('home'),
            away: interaction.options.getString('away'),
            homeGoals: result.match.score.home,
            awayGoals: result.match.score.away,
        },
        postImageHint: body(
            tr('handlers.scoreCorrect.roundLeg', { round: result.match.round, leg: result.match.leg }),
            tr('handlers.scoreCorrect.standingsRebuilt'),
        ),
        renderResult,
    }));
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleForfeit(interaction, ctx) {
    const { locale, tr, client } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);

    const result = await MatchService.recordForfeit(guildId, actorId, slug, {
        homeTeam: interaction.options.getString('home', true),
        awayTeam: interaction.options.getString('away', true),
        winnerTeam: interaction.options.getString('winner', true),
        round: interaction.options.getInteger('round') ?? undefined
    });

    const renderResult = await renderMatchVisual(result.league, result.match, { locale, tr, client });

    const { announceMatchResult } = require('./announcements');
    await announceMatchResult(client, {
        league: result.league,
        match: result.match,
        tr,
        locale,
        kind: 'forfeit',
    });

    await sendLeagueReply(interaction, buildMatchResultV2Reply({
        tr,
        slug: result.league.slug,
        leagueName: result.league.name,
        round: result.match.round,
        totalRounds: result.league.totalRounds || result.match.round,
        titleKey: 'handlers.forfeit.recorded',
        titleParams: { winner: interaction.options.getString('winner') },
        postImageHint: body(
            tr('handlers.forfeit.score', {
                home: interaction.options.getString('home'),
                away: interaction.options.getString('away'),
                homeGoals: result.match.score.home,
                awayGoals: result.match.score.away,
            }),
            tr('handlers.forfeit.roundLeg', { round: result.match.round, leg: result.match.leg }),
            tr('handlers.forfeit.currentRound', { round: result.league.currentRound }),
        ),
        renderResult,
    }));
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleStandings(interaction, ctx) {
    const { locale, tr, client } = ctx;
    const slug = leagueSlug(interaction);
    const { buildStandingsShowPayload } = require('./standingsNav');

    try {
        const payload = await buildStandingsShowPayload({
            guildId: interaction.guild.id,
            slug,
            page: interaction.options.getInteger('page') ?? 1,
            locale,
            tr,
            client,
        });

        await sendLeagueReply(interaction, stripLeagueReplyMeta(payload));
    } catch (err) {
        if (err instanceof LeagueError && err.code === 'NO_FIXTURE_VIEW') {
            await send(interaction, {
                tr,
                variant: 'league',
                descriptionKey: 'handlers.standings.noFixture',
            });
            return;
        }

        throw err;
    }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} subcommand
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleSettings(interaction, subcommand, ctx) {
    const { tr } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);
    const emDash = tr('common.emDash');

    if (subcommand === 'show') {
        const league = await LeagueSettingsService.getSettings(guildId, slug);

        await send(interaction, {
            tr,
            variant: 'league',
            titleKey: 'handlers.settings.show.title',
            titleParams: { name: league.name },
            description: body(
                tr('handlers.settings.show.points', {
                    win: league.settings.pointsWin,
                    draw: league.settings.pointsDraw,
                    loss: league.settings.pointsLoss
                }),
                tr('handlers.settings.show.teams', {
                    min: league.settings.minTeams,
                    max: league.settings.maxTeams
                }),
                tr('handlers.settings.show.owner', { owner: `<@${league.permissions.ownerId}>` }),
                tr('handlers.settings.show.admins', {
                    admins: (league.permissions.adminIds || []).map((id) => `<@${id}>`).join(', ') || emDash
                }),
                tr('handlers.settings.show.scoreReporters', {
                    reporters: (league.permissions.scoreReporterIds || []).map((id) => `<@${id}>`).join(', ') || emDash
                }),
                tr('handlers.settings.show.announcements', {
                    channel: league.channels?.announcementsChannelId
                        ? `<#${league.channels.announcementsChannelId}>`
                        : emDash
                })
            )
        });
        return;
    }

    if (subcommand === 'points') {
        const updated = await LeagueSettingsService.updatePoints(guildId, actorId, slug, {
            pointsWin: interaction.options.getInteger('win') ?? undefined,
            pointsDraw: interaction.options.getInteger('draw') ?? undefined,
            pointsLoss: interaction.options.getInteger('loss') ?? undefined
        });

        await send(interaction, {
            tr,
            variant: 'league',
            descriptionKey: 'handlers.settings.points.updated',
            descriptionParams: {
                win: updated.settings.pointsWin,
                draw: updated.settings.pointsDraw,
                loss: updated.settings.pointsLoss
            },

        });
        return;
    }

    if (subcommand === 'permission') {
        const user = interaction.options.getUser('user', true);
        const updated = await LeagueSettingsService.updatePermission(
            guildId,
            actorId,
            slug,
            user.id,
            interaction.options.getString('role', true),
            interaction.options.getString('action', true)
        );

        await send(interaction, {
            tr,
            variant: 'league',
            descriptionKey: 'handlers.settings.permission.updated',
            descriptionParams: { name: updated.name, slug },

        });
        return;
    }

    if (subcommand === 'channel') {
        const channel = interaction.options.getChannel('announcements');
        const updated = await LeagueSettingsService.setAnnouncementsChannel(
            guildId,
            actorId,
            slug,
            channel?.id ?? null
        );

        await send(interaction, {
            tr,
            variant: 'league',
            descriptionKey: updated.channels?.announcementsChannelId
                ? 'handlers.settings.channel.set'
                : 'handlers.settings.channel.cleared',
            descriptionParams: updated.channels?.announcementsChannelId
                ? { channel: `<#${updated.channels.announcementsChannelId}>` }
                : undefined,

        });
    }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleAudit(interaction, ctx) {
    const { tr } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);
    const league = await LeagueService.resolveLeague(guildId, slug);
    PermissionService.assertCanManageLeague(league, actorId);
    const limit = interaction.options.getInteger('limit') ?? 10;
    const entries = await AuditService.listForLeague(league._id, { limit });

    await send(interaction, {
        tr,
        variant: 'league',
        titleKey: 'handlers.audit.title',
        titleParams: { name: league.name, count: entries.length },
        description: formatAuditLog(entries, tr)
    });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleReset(interaction, ctx) {
    const { tr } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);
    const result = await ResetService.resetLeague(guildId, actorId, slug);

    await send(interaction, {
        tr,
        variant: 'league',
        titleKey: 'handlers.reset.success',
        titleParams: { name: result.league.name },
        description: body(
            tr('handlers.reset.stats', {
                matches: result.matchesRemoved,
                teams: result.teamCount,
                status: result.league.status,
                season: result.league.season
            }),
            tr('handlers.reset.nextStep', { slug: result.league.slug })
        )
    });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleRollback(interaction, ctx) {
    const { locale, tr, client } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);
    const { league, standing } = await RollbackService.recoverStandings(guildId, actorId, slug);

    const teamMap = await buildTeamMap(league._id, client);
    const renderResult = await renderStandingsVisual(league, standing, teamMap, { locale, tr });
    const statsParams = {
        version: standing.version,
        entries: standing.entries?.length ?? 0,
    };
    const statsText = tr('handlers.rollback.stats', statsParams);

    await sendLeagueReply(interaction, buildRollbackV2Reply({
        tr,
        slug,
        titleParams: { name: league.name },
        statsText,
        renderResult,
    }));
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} subcommand
 * @param {{ locale: string, tr: Function, client: import('../../client/DiscordBot') }} ctx
 */
async function handleMatch(interaction, subcommand, ctx) {
    const { tr } = ctx;
    const { guildId, actorId } = guildContext(interaction);
    const slug = leagueSlug(interaction);

    const result = await MatchService.setMatchStatus(guildId, actorId, slug, {
        homeTeam: interaction.options.getString('home', true),
        awayTeam: interaction.options.getString('away', true),
        round: interaction.options.getInteger('round') ?? undefined,
        action: subcommand,
    });

    const home = result.homeTeam.shortName || result.homeTeam.name;
    const away = result.awayTeam.shortName || result.awayTeam.name;

    await send(interaction, {
        tr,
        variant: 'league',
        titleKey: `handlers.match.${subcommand}.success`,
        titleParams: { home, away, round: result.match.round },
        description: tr(`handlers.match.${subcommand}.detail`, {
            status: result.match.status,
            round: result.match.round,
            leg: result.match.leg,
        }),
    });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} subcommand
 * @param {string | null} subcommandGroup
 */
function lockKeyFor(interaction, subcommand, subcommandGroup) {
    const slug = interaction.options.getString('league', false);
    if (!slug) return null;

    const guildId = interaction.guild.id;
    const needsWriteLock = ['score', 'score-correct', 'forfeit'].includes(subcommand)
        || (subcommandGroup === 'match' && ['postpone', 'cancel', 'resume'].includes(subcommand))
        || (subcommandGroup === 'fixture' && ['generate', 'regenerate'].includes(subcommand))
        || (subcommandGroup === 'team' && ['add', 'remove', 'edit'].includes(subcommand))
        || (subcommandGroup === 'rollback' && subcommand === 'standings')
        || subcommand === 'reset'
        || (subcommandGroup === 'settings' && ['points', 'permission', 'channel'].includes(subcommand));

    if (needsWriteLock) {
        return leagueLockKey(guildId, slug, LEAGUE_WRITE_SCOPE);
    }

    return null;
}

/**
 * @param {string} subcommand
 * @param {string | null} subcommandGroup
 */
function needsDefer(subcommand, subcommandGroup) {
    if (subcommandGroup === 'fixture' && ['show', 'generate', 'regenerate'].includes(subcommand)) {
        return true;
    }

    if (subcommandGroup === 'team' && subcommand === 'list') return true;
    if (subcommand === 'standings') return true;
    if (['score', 'score-correct', 'forfeit'].includes(subcommand)) return true;
    if (subcommandGroup === 'rollback') return true;
    if (subcommand === 'reset') return true;
    return false;
}

module.exports = {
    handleCreate,
    handleList,
    handleFixture,
    handleTeam,
    handleScore,
    handleScoreCorrect,
    handleForfeit,
    handleStandings,
    handleSettings,
    handleAudit,
    handleRollback,
    handleReset,
    handleMatch,
    lockKeyFor,
    needsDefer
};