const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
const { deliver, sendCompact, normalizeDeliverPayload } = require('../../ui/ReplyService');
const { buildDashboardShell } = require('../design/shell');
const LeagueService = require('../../league/services/LeagueService');
const TeamService = require('../../league/services/TeamService');
const FixtureService = require('../../league/services/FixtureService');
const MatchService = require('../../league/services/MatchService');
const LeagueSettingsService = require('../../league/services/LeagueSettingsService');
const RollbackService = require('../../league/services/RollbackService');
const ResetService = require('../../league/services/ResetService');
const LeagueError = require('../../league/errors/LeagueError');
const { hasManageGuild } = require('../permissions');
const { parseDashboardId } = require('../ids');
const { parsePanelRef } = require('../panelBackNav');
const {
    DASHBOARD_PREFIX,
    DASHBOARD_VIEWS,
    HUB_ACTIONS,
    LEAGUE_ACTIONS,
    TEAM_ACTIONS,
    SETTINGS_ACTIONS,
    MATCH_OPS_ACTIONS,
    ADMIN_ACTIONS,
    STANDINGS_ACTIONS,
    MODAL_IDS,
} = require('../constants');
const StandingService = require('../../league/services/StandingService');
const { resolveStandingsNavTarget } = require('../../league/discord/standingsNav');
const { paginateTable } = require('../../league/render/drawing/paginateTable');
const { buildGuildHubPayload } = require('../views/guildHub');
const { buildLeagueHubPayload } = require('../views/leagueHub');
const { renderPanelPayload } = require('../panels/renderPanel');
const { resolveMatchContext } = require('../panels/matchOpsPanel');
const { buildPermissionActionRows } = require('../panels/settingsPanel');
const {
    buildCreateLeagueModal,
    buildAddTeamModal,
    buildRemoveTeamModal,
    buildEditPointsModal,
    buildForfeitModal,
    parseModalSlug,
} = require('./modals');
const { DEFAULT_LEAGUE_FORMAT } = require('../../league/constants/leagueFormat');
const { withOperationLock, leagueLockKey } = require('../../league/discord/operationLock');
const { LEAGUE_WRITE_SCOPE } = require('../../league/discord/constants');

/**
 * @template T
 * @param {string} guildId
 * @param {string} slug
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
function withDashboardWriteLock(guildId, slug, fn) {
    return withOperationLock(leagueLockKey(guildId, slug, LEAGUE_WRITE_SCOPE), fn);
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {import('../../client/DiscordBot')} client
 */
async function interactionContext(interaction, client) {
    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guild = interaction.guild;
    const member = interaction.member;
    const userId = interaction.user.id;

    return { locale, tr, guild, member, userId, client };
}

/**
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {string} slug
 * @param {string} panel
 * @param {object} [options]
 */
async function renderPanel(interaction, ctx, slug, panel, options = {}) {
    const payload = await renderPanelPayload({
        panel,
        guildId: ctx.guild.id,
        slug,
        guild: ctx.guild,
        member: ctx.member,
        userId: ctx.userId,
        tr: ctx.tr,
        locale: ctx.locale,
        client: ctx.client,
        options,
    });

    return normalizeDeliverPayload(payload);
}

/**
 * @param {import('discord.js').Interaction} interaction
 */
async function ensureDashboardDeferred(interaction) {
    if (interaction.deferred || interaction.replied) {
        return;
    }

    if (interaction.isChatInputCommand?.()) {
        await interaction.deferReply();
        return;
    }

    if (interaction.isMessageComponent?.()
        || interaction.isStringSelectMenu?.()
        || interaction.isUserSelectMenu?.()
        || interaction.isChannelSelectMenu?.()) {
        await interaction.deferUpdate();
    }
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {object} ctx
 * @param {string} [slug]
 */
async function renderGuildHub(interaction, ctx, slug) {
    if (slug) {
        const payload = await buildLeagueHubPayload({
            guildId: ctx.guild.id,
            slug,
            guildName: ctx.guild.name,
            member: ctx.member,
            userId: ctx.userId,
            tr: ctx.tr,
            client: ctx.client,
            locale: ctx.locale,
        });

        await deliver(interaction, normalizeDeliverPayload(payload));
        return;
    }

    const payload = await buildGuildHubPayload({
        guild: ctx.guild,
        member: ctx.member,
        userId: ctx.userId,
        tr: ctx.tr,
    });

    await deliver(interaction, normalizeDeliverPayload(payload));
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {import('../../client/DiscordBot')} client
 * @param {string} [initialSlug]
 */
async function openDashboard(interaction, client, initialSlug) {
    if (!interaction.guild) {
        const ctx = await interactionContext(interaction, client);

        await sendCompact(interaction, {
            tr: ctx.tr,
            description: ctx.tr('dashboard.errors.guildOnly'),
            tone: 'warning',
            ephemeral: true,
        });
        return;
    }

    await ensureDashboardDeferred(interaction);
    const ctx = await interactionContext(interaction, client);
    await renderGuildHub(interaction, ctx, initialSlug?.trim().toLowerCase() || undefined);
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {Error} err
 */
async function handleDashboardError(interaction, ctx, err) {
    if (!(err instanceof LeagueError)) {
        console.error('[dashboard] interaction failed:', err);
    }

    const message = err instanceof LeagueError
        ? ctx.tr(`errors.${err.code}`, err.params)
        : ctx.tr('errors.GENERIC_LEAGUE_ERROR');

    await sendCompact(interaction, {
        tr: ctx.tr,
        description: message,
        tone: 'danger',
        ephemeral: true,
    });
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {import('../../client/DiscordBot')} client
 */
async function handleDashboardInteraction(interaction, client) {
    const customId = interaction.customId;

    if (!customId?.startsWith(DASHBOARD_PREFIX)) {
        return;
    }

    if (!interaction.guild) {
        return;
    }

    if (interaction.isStringSelectMenu()
        || interaction.isChannelSelectMenu()
        || interaction.isUserSelectMenu()) {
        await interaction.deferUpdate();
    }

    const ctx = await interactionContext(interaction, client);

    try {
        if (interaction.isModalSubmit()) {
            await handleDashboardModal(interaction, ctx);
            return;
        }

        const parsed = parseDashboardId(customId);

        if (!parsed) {
            return;
        }

        if (interaction.isButton()) {
            await handleDashboardButton(interaction, ctx, parsed);
            return;
        }

        if (interaction.isStringSelectMenu()) {
            await handleDashboardSelect(interaction, ctx, parsed);
            return;
        }

        if (interaction.isUserSelectMenu()) {
            await handleDashboardUserSelect(interaction, ctx, parsed);
            return;
        }

        if (interaction.isChannelSelectMenu()) {
            await handleDashboardChannelSelect(interaction, ctx, parsed);
        }
    } catch (err) {
        await handleDashboardError(interaction, ctx, err);
    }
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 */
async function handleDashboardModal(interaction, ctx) {
    const customId = interaction.customId;

    if (customId === MODAL_IDS.CREATE_LEAGUE) {
        await handleCreateLeagueModal(interaction, ctx);
        return;
    }

    const addSlug = parseModalSlug(customId, MODAL_IDS.ADD_TEAM);
    if (addSlug) {
        await handleAddTeamModal(interaction, ctx, addSlug);
        return;
    }

    const removeSlug = parseModalSlug(customId, MODAL_IDS.REMOVE_TEAM);
    if (removeSlug) {
        await handleRemoveTeamModal(interaction, ctx, removeSlug);
        return;
    }

    const pointsSlug = parseModalSlug(customId, MODAL_IDS.EDIT_POINTS);
    if (pointsSlug) {
        await handleEditPointsModal(interaction, ctx, pointsSlug);
        return;
    }

    if (customId.startsWith(`${MODAL_IDS.FORFEIT}:`)) {
        const matchId = customId.slice(MODAL_IDS.FORFEIT.length + 1);
        await handleForfeitModal(interaction, ctx, matchId);
    }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleDashboardButton(interaction, ctx, parsed) {
    if (parsed.view === DASHBOARD_VIEWS.HUB && parsed.action === HUB_ACTIONS.CREATE) {
        if (!hasManageGuild(ctx.member)) {
            await sendCompact(interaction, {
                tr: ctx.tr,
                description: ctx.tr('dashboard.errors.manageGuild'),
                tone: 'warning',
                ephemeral: true,
            });
            return;
        }

        await interaction.showModal(buildCreateLeagueModal(ctx.tr));
        return;
    }

    if (parsed.view === DASHBOARD_VIEWS.LEAGUE && parsed.action === LEAGUE_ACTIONS.BACK) {
        await interaction.deferUpdate();
        const payload = parsed.slug
            ? await buildLeagueHubPayload({
                guildId: ctx.guild.id,
                slug: parsed.slug,
                guildName: ctx.guild.name,
                member: ctx.member,
                userId: ctx.userId,
                tr: ctx.tr,
                client: ctx.client,
                locale: ctx.locale,
            })
            : await buildGuildHubPayload({
                guild: ctx.guild,
                member: ctx.member,
                userId: ctx.userId,
                tr: ctx.tr,
            });

        await interaction.editReply(normalizeDeliverPayload(payload));
        return;
    }

    if (parsed.view === DASHBOARD_VIEWS.TEAMS && parsed.slug) {
        await handleTeamsButton(interaction, ctx, parsed);
        return;
    }

    if (parsed.view === DASHBOARD_VIEWS.SETTINGS && parsed.slug) {
        await handleSettingsButton(interaction, ctx, parsed);
        return;
    }

    if (parsed.view === DASHBOARD_VIEWS.MATCH_OPS && parsed.slug) {
        await handleMatchOpsButton(interaction, ctx, parsed);
        return;
    }

    if (parsed.view === DASHBOARD_VIEWS.STANDINGS && parsed.slug) {
        await handleStandingsButton(interaction, ctx, parsed);
        return;
    }

    if (parsed.view === DASHBOARD_VIEWS.ADMIN && parsed.slug) {
        await handleAdminButton(interaction, ctx, parsed);
    }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleStandingsButton(interaction, ctx, parsed) {
    if (parsed.action === STANDINGS_ACTIONS.PAGE_LABEL) {
        return;
    }

    const { slug, extras } = parsePanelRef(parsed.slug);
    const page = Number(extras[0]) || 1;

    if (!slug) {
        return;
    }

    await interaction.deferUpdate();

    const { standing } = await StandingService.getStandings(ctx.guild.id, slug);
    const totalPages = paginateTable(standing?.entries ?? [], { page }).totalPages;
    const target = resolveStandingsNavTarget(parsed.action, page, totalPages);
    const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.STANDINGS, {
        page: target.page,
    });

    await interaction.editReply(payload);
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleTeamsButton(interaction, ctx, parsed) {
    const slug = parsed.slug;

    if (parsed.action === TEAM_ACTIONS.ADD) {
        await interaction.showModal(buildAddTeamModal(ctx.tr, slug));
        return;
    }

    if (parsed.action === TEAM_ACTIONS.REMOVE) {
        await interaction.showModal(buildRemoveTeamModal(ctx.tr, slug));
        return;
    }

    if (parsed.action === TEAM_ACTIONS.GENERATE) {
        await interaction.deferUpdate();
        const result = await withDashboardWriteLock(ctx.guild.id, slug, () =>
            FixtureService.generateFixture(ctx.guild.id, ctx.userId, slug));
        const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.TEAMS);

        await interaction.editReply(payload);
        await interaction.followUp({
            content: ctx.tr('dashboard.teams.generated', {
                name: result.league.name,
                matchCount: result.matchCount,
                totalRounds: result.totalRounds,
            }),
            ephemeral: true,
        });
    }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleSettingsButton(interaction, ctx, parsed) {
    if (parsed.action === SETTINGS_ACTIONS.POINTS) {
        await interaction.showModal(buildEditPointsModal(ctx.tr, parsed.slug));
        return;
    }

    if (parsed.action === SETTINGS_ACTIONS.PERM_APPLY && parsed.slug) {
        const { slug, extras } = parsePanelRef(parsed.slug);
        const [userId, role, action] = extras;

        await interaction.deferUpdate();
        const updated = await withDashboardWriteLock(ctx.guild.id, slug, () =>
            LeagueSettingsService.updatePermission(
                ctx.guild.id,
                ctx.userId,
                slug,
                userId,
                role,
                action,
            ));

        const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.SETTINGS);
        await interaction.editReply(payload);
        await interaction.followUp({
            content: ctx.tr('handlers.settings.permission.updated', {
                name: updated.name,
                slug: updated.slug,
            }),
            ephemeral: true,
        });
    }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleMatchOpsButton(interaction, ctx, parsed) {
    const matchId = parsed.slug;

    if (parsed.action === MATCH_OPS_ACTIONS.FORFEIT) {
        const context = await resolveMatchContext(matchId);

        if (!context) {
            throw new LeagueError('MATCH_NOT_FOUND');
        }

        const homeName = context.homeTeam?.shortName || context.homeTeam?.name || '?';
        const awayName = context.awayTeam?.shortName || context.awayTeam?.name || '?';

        await interaction.showModal(buildForfeitModal(ctx.tr, matchId, homeName, awayName));
        return;
    }

    const actionMap = {
        [MATCH_OPS_ACTIONS.POSTPONE]: 'postpone',
        [MATCH_OPS_ACTIONS.CANCEL]: 'cancel',
        [MATCH_OPS_ACTIONS.RESUME]: 'resume',
    };

    const statusAction = actionMap[parsed.action];

    if (!statusAction) {
        return;
    }

    const context = await resolveMatchContext(matchId);

    if (!context) {
        throw new LeagueError('MATCH_NOT_FOUND');
    }

    const homeName = context.homeTeam?.name;
    const awayName = context.awayTeam?.name;

    await interaction.deferUpdate();

    await withDashboardWriteLock(ctx.guild.id, context.league.slug, () =>
        MatchService.setMatchStatus(ctx.guild.id, ctx.userId, context.league.slug, {
            homeTeam: homeName,
            awayTeam: awayName,
            round: context.match.round,
            action: statusAction,
        }));

    const payload = await renderPanel(interaction, ctx, context.league.slug, DASHBOARD_VIEWS.MATCH_OPS, {
        selectedMatchId: matchId,
    });

    await interaction.editReply(payload);
    await interaction.followUp({
        content: ctx.tr(`handlers.match.${statusAction}.success`, {
            home: context.homeTeam?.shortName || homeName,
            away: context.awayTeam?.shortName || awayName,
            round: context.match.round,
        }),
        ephemeral: true,
    });
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleAdminButton(interaction, ctx, parsed) {
    const slug = parsed.slug;

    if (parsed.action === ADMIN_ACTIONS.REFRESH) {
        await interaction.deferUpdate();
        const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.ADMIN);
        await interaction.editReply(payload);
        return;
    }

    if (parsed.action === ADMIN_ACTIONS.ROLLBACK) {
        await interaction.deferUpdate();
        const { league } = await withDashboardWriteLock(ctx.guild.id, slug, () =>
            RollbackService.recoverStandings(ctx.guild.id, ctx.userId, slug));
        const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.ADMIN);

        await interaction.editReply(payload);
        await interaction.followUp({
            content: ctx.tr('dashboard.admin.rollbackDone', { name: league.name }),
            ephemeral: true,
        });
        return;
    }

    if (parsed.action === ADMIN_ACTIONS.RESET) {
        await interaction.deferUpdate();
        const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.ADMIN, {
            confirmReset: true,
        });
        await interaction.editReply(payload);
        return;
    }

    if (parsed.action === ADMIN_ACTIONS.RESET_CONFIRM) {
        await interaction.deferUpdate();
        const result = await withDashboardWriteLock(ctx.guild.id, slug, () =>
            ResetService.resetLeague(ctx.guild.id, ctx.userId, slug));
        const payload = await buildLeagueHubPayload({
            guildId: ctx.guild.id,
            slug: result.league.slug,
            guildName: ctx.guild.name,
            member: ctx.member,
            userId: ctx.userId,
            tr: ctx.tr,
            client: ctx.client,
            locale: ctx.locale,
        });

        await interaction.editReply(normalizeDeliverPayload(payload));
        await interaction.followUp({
            content: ctx.tr('handlers.reset.success', { name: result.league.name }),
            ephemeral: true,
        });
    }
}

/**
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleDashboardSelect(interaction, ctx, parsed) {
    const value = interaction.values[0];

    if (parsed.view === DASHBOARD_VIEWS.HUB && parsed.action === HUB_ACTIONS.LEAGUE_SELECT) {
        const payload = await buildLeagueHubPayload({
            guildId: ctx.guild.id,
            slug: value,
            guildName: ctx.guild.name,
            member: ctx.member,
            userId: ctx.userId,
            tr: ctx.tr,
            client: ctx.client,
            locale: ctx.locale,
        });

        await interaction.editReply(normalizeDeliverPayload(payload));
        return;
    }

    if (parsed.view === DASHBOARD_VIEWS.LEAGUE && parsed.action === LEAGUE_ACTIONS.PANEL && parsed.slug) {
        const payload = await renderPanel(interaction, ctx, parsed.slug, value);
        await interaction.editReply(payload);
        return;
    }

    if (parsed.view === DASHBOARD_VIEWS.MATCH_OPS && parsed.action === MATCH_OPS_ACTIONS.SELECT && parsed.slug) {
        const payload = await renderPanel(interaction, ctx, parsed.slug, DASHBOARD_VIEWS.MATCH_OPS, {
            selectedMatchId: value,
        });
        await interaction.editReply(payload);
    }
}

/**
 * @param {import('discord.js').UserSelectMenuInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleDashboardUserSelect(interaction, ctx, parsed) {
    if (parsed.view !== DASHBOARD_VIEWS.SETTINGS || parsed.action !== SETTINGS_ACTIONS.PERM_USER || !parsed.slug) {
        return;
    }

    const userId = interaction.values[0];
    const rows = buildPermissionActionRows(ctx.tr, parsed.slug, userId);

    await deliver(interaction, buildDashboardShell({
        view: DASHBOARD_VIEWS.SETTINGS,
        tr: ctx.tr,
        title: ctx.tr('dashboard.panels.settings.title'),
        body: ctx.tr('dashboard.settings.pickPermAction', { user: `<@${userId}>` }),
        actionRows: rows,
        compact: true,
        ephemeral: true,
        includeHero: false,
    }));
}

/**
 * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {ReturnType<typeof parseDashboardId>} parsed
 */
async function handleDashboardChannelSelect(interaction, ctx, parsed) {
    if (parsed.view !== DASHBOARD_VIEWS.SETTINGS || parsed.action !== SETTINGS_ACTIONS.CHANNEL || !parsed.slug) {
        return;
    }

    const channelId = interaction.values[0] ?? null;

    await withDashboardWriteLock(ctx.guild.id, parsed.slug, () =>
        LeagueSettingsService.setAnnouncementsChannel(
            ctx.guild.id,
            ctx.userId,
            parsed.slug,
            channelId,
        ));

    const payload = await renderPanel(interaction, ctx, parsed.slug, DASHBOARD_VIEWS.SETTINGS);
    await interaction.editReply(payload);

    await interaction.followUp({
        content: channelId
            ? ctx.tr('handlers.settings.channel.set', { channel: `<#${channelId}>` })
            : ctx.tr('handlers.settings.channel.cleared'),
        ephemeral: true,
    });
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 */
async function handleCreateLeagueModal(interaction, ctx) {
    if (!hasManageGuild(ctx.member)) {
        await sendCompact(interaction, {
            tr: ctx.tr,
            description: ctx.tr('dashboard.errors.manageGuild'),
            tone: 'warning',
            ephemeral: true,
        });
        return;
    }

    await interaction.deferUpdate();

    const name = interaction.fields.getTextInputValue('name');
    const slug = interaction.fields.getTextInputValue('slug') || undefined;
    const formatRaw = interaction.fields.getTextInputValue('format')?.trim();
    const format = formatRaw || DEFAULT_LEAGUE_FORMAT;

    const league = await withDashboardWriteLock(ctx.guild.id, slug?.trim().toLowerCase() || '__create__', () =>
        LeagueService.createLeague(ctx.guild.id, ctx.userId, {
            name,
            slug,
            format,
        }));

    const payload = await buildLeagueHubPayload({
        guildId: ctx.guild.id,
        slug: league.slug,
        guildName: ctx.guild.name,
        member: ctx.member,
        userId: ctx.userId,
        tr: ctx.tr,
        client: ctx.client,
        locale: ctx.locale,
    });

    await interaction.editReply(normalizeDeliverPayload(payload));

    await interaction.followUp({
        content: ctx.tr('dashboard.hub.created', { name: league.name, slug: league.slug }),
        ephemeral: true,
    });
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {string} slug
 */
async function handleAddTeamModal(interaction, ctx, slug) {
    await interaction.deferUpdate();

    const team = await withDashboardWriteLock(ctx.guild.id, slug, () =>
        TeamService.addTeam(ctx.guild.id, ctx.userId, slug, {
            name: interaction.fields.getTextInputValue('name'),
            shortName: interaction.fields.getTextInputValue('short_name') || undefined,
        }));

    const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.TEAMS);
    await interaction.editReply(payload);

    await interaction.followUp({
        content: ctx.tr('handlers.team.add.success', { name: team.name, shortName: team.shortName, slug }),
        ephemeral: true,
    });
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {string} slug
 */
async function handleRemoveTeamModal(interaction, ctx, slug) {
    await interaction.deferUpdate();

    const team = await withDashboardWriteLock(ctx.guild.id, slug, () =>
        TeamService.removeTeam(
            ctx.guild.id,
            ctx.userId,
            slug,
            interaction.fields.getTextInputValue('name'),
        ));

    const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.TEAMS);
    await interaction.editReply(payload);

    await interaction.followUp({
        content: ctx.tr('handlers.team.remove.success', { name: team.name, slug }),
        ephemeral: true,
    });
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {string} slug
 */
async function handleEditPointsModal(interaction, ctx, slug) {
    const parseOptionalInt = (value) => {
        const trimmed = value?.trim();
        return trimmed ? Number.parseInt(trimmed, 10) : undefined;
    };

    await interaction.deferUpdate();

    const updated = await withDashboardWriteLock(ctx.guild.id, slug, () =>
        LeagueSettingsService.updatePoints(ctx.guild.id, ctx.userId, slug, {
            pointsWin: parseOptionalInt(interaction.fields.getTextInputValue('win')),
            pointsDraw: parseOptionalInt(interaction.fields.getTextInputValue('draw')),
            pointsLoss: parseOptionalInt(interaction.fields.getTextInputValue('loss')),
        }));

    const payload = await renderPanel(interaction, ctx, slug, DASHBOARD_VIEWS.SETTINGS);
    await interaction.editReply(payload);

    await interaction.followUp({
        content: ctx.tr('handlers.settings.points.updated', {
            win: updated.settings.pointsWin,
            draw: updated.settings.pointsDraw,
            loss: updated.settings.pointsLoss,
        }),
        ephemeral: true,
    });
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {Awaited<ReturnType<typeof interactionContext>>} ctx
 * @param {string} matchId
 */
async function handleForfeitModal(interaction, ctx, matchId) {
    await interaction.deferUpdate();

    const context = await resolveMatchContext(matchId);

    if (!context) {
        throw new LeagueError('MATCH_NOT_FOUND');
    }

    const winnerTeam = interaction.fields.getTextInputValue('winner');
    const homeName = context.homeTeam?.name;
    const awayName = context.awayTeam?.name;

    const result = await withDashboardWriteLock(ctx.guild.id, context.league.slug, () =>
        MatchService.recordForfeit(ctx.guild.id, ctx.userId, context.league.slug, {
            homeTeam: homeName,
            awayTeam: awayName,
            winnerTeam,
            round: context.match.round,
        }));

    const { announceMatchResult } = require('../../league/discord/announcements');
    await announceMatchResult(ctx.client, {
        league: result.league,
        match: result.match,
        tr: ctx.tr,
        locale: ctx.locale,
        kind: 'forfeit',
    });

    const payload = await renderPanel(interaction, ctx, context.league.slug, DASHBOARD_VIEWS.MATCH_OPS, {
        selectedMatchId: matchId,
    });

    await interaction.editReply(payload);
    await interaction.followUp({
        content: ctx.tr('handlers.forfeit.recorded', { winner: winnerTeam }),
        ephemeral: true,
    });
}

module.exports = {
    openDashboard,
    handleDashboardInteraction,
    interactionContext,
    renderPanel,
};