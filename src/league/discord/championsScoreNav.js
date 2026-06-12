const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const LeagueService = require('../services/LeagueService');
const MatchService = require('../services/MatchService');
const TournamentService = require('../services/TournamentService');
const PermissionService = require('../services/PermissionService');
const MatchRepository = require('../repositories/MatchRepository');
const TeamRepository = require('../repositories/TeamRepository');
const { needsPenalties } = require('../tournament/tieResolver');
const { SUBMITTABLE_STATUSES } = require('../match/constants');
const { paginateTable } = require('../render/drawing/paginateTable');
const LAYOUT = require('../render/constants/layout');
const { normalizeDeliverPayload } = require('../../ui/ReplyService');
const LeagueError = require('../errors/LeagueError');
const { leagueLockKey, withOperationLock } = require('./operationLock');
const { LEAGUE_WRITE_SCOPE } = require('./constants');
const { TOURNAMENT_STATUS } = require('../constants/tournamentStatus');

const CHAMPIONS_SCORE_PREFIX = 'lcs:';
const CHAMPIONS_SCORE_SELECT_PREFIX = 'lcs:sel:';
const CHAMPIONS_SCORE_MODAL_PREFIX = 'lcs:mdl:';
const CHAMPIONS_PEN_MODAL_PREFIX = 'lcs:pen:';
const CHAMPIONS_OPS_SELECT_PREFIX = 'lcs:ops:';

const ACTIONS = {
    PREV_PAGE: 'pp',
    NEXT_PAGE: 'np',
    PENALTIES: 'pen',
    POSTPONE: 'post',
    CANCEL: 'can',
    RESUME: 'res',
};

function encodeChampionsScoreNavId(slug, page, action) {
    return `${CHAMPIONS_SCORE_PREFIX}${slug}:${page}:${action}`;
}

function parseChampionsScoreNavId(customId) {
    if (!customId.startsWith(CHAMPIONS_SCORE_PREFIX)
        || customId.startsWith(CHAMPIONS_SCORE_SELECT_PREFIX)
        || customId.startsWith(CHAMPIONS_SCORE_MODAL_PREFIX)
        || customId.startsWith(CHAMPIONS_PEN_MODAL_PREFIX)) {
        return null;
    }

    const body = customId.slice(CHAMPIONS_SCORE_PREFIX.length);
    const parts = body.split(':');

    if (parts.length < 3) {
        return null;
    }

    const slug = parts[0];
    const page = Number(parts[1]);
    const action = parts.slice(2).join(':');

    if (!slug || !Number.isFinite(page) || !action) {
        return null;
    }

    return { slug, page, action };
}

function encodeChampionsScoreSelectId(slug, page) {
    return `${CHAMPIONS_SCORE_SELECT_PREFIX}${slug}:${page}`;
}

function parseChampionsScoreSelectId(customId) {
    if (!customId.startsWith(CHAMPIONS_SCORE_SELECT_PREFIX)) {
        return null;
    }

    const body = customId.slice(CHAMPIONS_SCORE_SELECT_PREFIX.length);
    const pageColon = body.lastIndexOf(':');

    if (pageColon <= 0) {
        return null;
    }

    const page = Number(body.slice(pageColon + 1));
    const slug = body.slice(0, pageColon);

    if (!slug || !Number.isFinite(page)) {
        return null;
    }

    return { slug, page };
}

function encodeChampionsScoreModalId(slug, page, matchId) {
    return `${CHAMPIONS_SCORE_MODAL_PREFIX}${slug}:${page}:${matchId}`;
}

function parseChampionsScoreModalId(customId) {
    if (!customId.startsWith(CHAMPIONS_SCORE_MODAL_PREFIX)) {
        return null;
    }

    const body = customId.slice(CHAMPIONS_SCORE_MODAL_PREFIX.length);
    const matchColon = body.lastIndexOf(':');

    if (matchColon <= 0) {
        return null;
    }

    const matchId = body.slice(matchColon + 1);
    const rest = body.slice(0, matchColon);
    const pageColon = rest.lastIndexOf(':');

    if (pageColon <= 0) {
        return null;
    }

    const page = Number(rest.slice(pageColon + 1));
    const slug = rest.slice(0, pageColon);

    if (!slug || !Number.isFinite(page) || !matchId) {
        return null;
    }

    return { slug, page, matchId };
}

function encodeChampionsOpsSelectId(slug, page) {
    return `${CHAMPIONS_OPS_SELECT_PREFIX}${slug}:${page}`;
}

function parseChampionsOpsSelectId(customId) {
    if (!customId.startsWith(CHAMPIONS_OPS_SELECT_PREFIX)) {
        return null;
    }

    const body = customId.slice(CHAMPIONS_OPS_SELECT_PREFIX.length);
    const pageColon = body.lastIndexOf(':');

    if (pageColon <= 0) {
        return null;
    }

    const page = Number(body.slice(pageColon + 1));
    const slug = body.slice(0, pageColon);

    if (!slug || !Number.isFinite(page)) {
        return null;
    }

    return { slug, page };
}

function encodeChampionsPenModalId(slug, page, matchId) {
    return `${CHAMPIONS_PEN_MODAL_PREFIX}${slug}:${page}:${matchId}`;
}

function parseChampionsPenModalId(customId) {
    if (!customId.startsWith(CHAMPIONS_PEN_MODAL_PREFIX)) {
        return null;
    }

    const body = customId.slice(CHAMPIONS_PEN_MODAL_PREFIX.length);
    const matchColon = body.lastIndexOf(':');

    if (matchColon <= 0) {
        return null;
    }

    const matchId = body.slice(matchColon + 1);
    const rest = body.slice(0, matchColon);
    const pageColon = rest.lastIndexOf(':');

    if (pageColon <= 0) {
        return null;
    }

    const page = Number(rest.slice(pageColon + 1));
    const slug = rest.slice(0, pageColon);

    if (!slug || !Number.isFinite(page) || !matchId) {
        return null;
    }

    return { slug, page, matchId };
}

function formatMatchLabel(match, teamMap) {
    const home = teamMap.get(match.homeTeamId.toString());
    const away = teamMap.get(match.awayTeamId.toString());
    const homeName = home?.shortName || home?.name || '?';
    const awayName = away?.shortName || away?.name || '?';
    const phase = match.groupId
        ? `G${match.groupId} R${match.round}`
        : `${match.knockoutRound || 'KO'} L${match.leg || 1}`;

    if (['completed', 'walkover'].includes(match.status) && match.score) {
        return `[${phase}] ${homeName} ${match.score.home}-${match.score.away} ${awayName}`;
    }

    return `[${phase}] ${homeName} vs ${awayName}`;
}

async function buildChampionsScorePayload(input) {
    const { guildId, slug, tr, page = 1, actorId } = input;
    const league = await LeagueService.resolveLeague(guildId, slug);
    const { tournament } = await TournamentService.getTournamentState(guildId, slug);

    if (!tournament || [TOURNAMENT_STATUS.COMPLETED, TOURNAMENT_STATUS.CANCELLED].includes(tournament.status)) {
        throw new LeagueError('CL_NO_TOURNAMENT');
    }

    const matches = await MatchRepository.findSubmittableByTournament(tournament._id);
    const opsMatches = await MatchRepository.listByTournament(tournament._id);
    const operable = opsMatches.filter((match) =>
        ['scheduled', 'live', 'postponed'].includes(match.status));
    const teams = await TeamRepository.listActiveByLeague(league._id);
    const teamMap = new Map(teams.map((team) => [team._id.toString(), team]));
    const pageInfo = paginateTable(matches, { page, pageSize: LAYOUT.maxFixtureRowsPerPage });
    const canReport = PermissionService.canReportScore(league, actorId);
    const canManage = PermissionService.isAdmin(league, actorId);

    const lines = pageInfo.items.map((match) => formatMatchLabel(match, teamMap));
    const penaltyMatches = [];

    if (tournament.status === TOURNAMENT_STATUS.KNOCKOUT) {
        const completed = await MatchRepository.listByTournament(tournament._id);

        for (const tie of tournament.knockoutTies || []) {
            if (!needsPenalties(tie, completed)) {
                continue;
            }

            const tieMatch = completed.find(
                (match) => match.tieId === tie.tieId && ['completed', 'walkover'].includes(match.status),
            );

            if (tieMatch) {
                penaltyMatches.push(tieMatch);
            }
        }
    }

    const selectOptions = pageInfo.items.map((match) => ({
        label: formatMatchLabel(match, teamMap).slice(0, 100),
        value: match._id.toString(),
    }));

    if (selectOptions.length === 0) {
        selectOptions.push({ label: tr('handlers.champions.score.noMatches'), value: 'none' });
    }

    const actionRows = [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(encodeChampionsScoreSelectId(slug, pageInfo.page))
                .setPlaceholder(tr('handlers.champions.score.selectMatch'))
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions(selectOptions)
                .setDisabled(!canReport || pageInfo.items.length === 0),
        ),
    ];

    if (pageInfo.totalPages > 1) {
        actionRows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeChampionsScoreNavId(slug, pageInfo.page, ACTIONS.PREV_PAGE))
                    .setLabel(tr('common.prev'))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageInfo.page <= 1),
                new ButtonBuilder()
                    .setCustomId(encodeChampionsScoreNavId(slug, pageInfo.page, ACTIONS.NEXT_PAGE))
                    .setLabel(tr('common.next'))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageInfo.page >= pageInfo.totalPages),
            ),
        );
    }

    if (penaltyMatches.length > 0 && canReport) {
        const penMatch = penaltyMatches[0];
        actionRows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeChampionsScoreNavId(
                        slug,
                        pageInfo.page,
                        `${ACTIONS.PENALTIES}:${penMatch._id.toString()}`,
                    ))
                    .setLabel(tr('handlers.champions.score.enterPenalties'))
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚽'),
            ),
        );
    }

    if (canManage && operable.length > 0) {
        const opsOptions = operable.slice(0, 25).map((match) => ({
            label: formatMatchLabel(match, teamMap).slice(0, 100),
            value: match._id.toString(),
        }));

        actionRows.push(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(encodeChampionsOpsSelectId(slug, pageInfo.page))
                    .setPlaceholder(tr('dashboard.matchOps.selectMatch'))
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(opsOptions),
            ),
        );
    }

    const title = tr('handlers.champions.score.title', {
        page: pageInfo.page,
        totalPages: pageInfo.totalPages,
    });

    return normalizeDeliverPayload({
        content: [title, ...lines].join('\n') || tr('handlers.champions.score.empty'),
        components: actionRows,
    });
}

async function editChampionsScoreMessage(interaction, payload) {
    const { stripLeagueReplyMeta } = require('../utils/visualV2Reply');
    const normalized = normalizeDeliverPayload(stripLeagueReplyMeta(payload));

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(normalized);
        return;
    }

    await interaction.update(normalized);
}

async function handleChampionsOpsMatchSelect(client, interaction) {
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
    const parsed = parseChampionsOpsSelectId(interaction.customId);
    const matchId = interaction.values[0];

    if (!parsed || !matchId) {
        return;
    }

    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);

    await interaction.reply({
        content: tr('handlers.champions.score.opsPrompt'),
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeChampionsScoreNavId(parsed.slug, parsed.page, `${ACTIONS.POSTPONE}:${matchId}`))
                    .setLabel(tr('dashboard.matchOps.postpone'))
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(encodeChampionsScoreNavId(parsed.slug, parsed.page, `${ACTIONS.CANCEL}:${matchId}`))
                    .setLabel(tr('dashboard.matchOps.cancel'))
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(encodeChampionsScoreNavId(parsed.slug, parsed.page, `${ACTIONS.RESUME}:${matchId}`))
                    .setLabel(tr('dashboard.matchOps.resume'))
                    .setStyle(ButtonStyle.Success),
            ),
        ],
        ephemeral: true,
    });
}

async function handleChampionsScoreNavButton(client, interaction) {
    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');

    if (isDuplicateInteraction(interaction.id)) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate().catch(() => {});
        }

        return;
    }

    const parsed = parseChampionsScoreNavId(interaction.customId);

    if (!parsed) {
        return;
    }

    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guildId = interaction.guild?.id;

    if (!guildId) {
        return;
    }

    if (parsed.action.startsWith(`${ACTIONS.PENALTIES}:`)) {
        const matchId = parsed.action.slice(`${ACTIONS.PENALTIES}:`.length);
        const match = await MatchRepository.findById(matchId);

        if (!match) {
            return;
        }

        const [homeTeam, awayTeam] = await Promise.all([
            TeamRepository.findById(match.homeTeamId),
            TeamRepository.findById(match.awayTeamId),
        ]);

        const modal = new ModalBuilder()
            .setCustomId(encodeChampionsPenModalId(parsed.slug, parsed.page, matchId))
            .setTitle(tr('handlers.champions.score.penaltiesModalTitle').slice(0, 45))
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('penalties_home')
                        .setLabel((homeTeam?.shortName || homeTeam?.name || 'Home').slice(0, 45))
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(2)
                        .setRequired(true),
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('penalties_away')
                        .setLabel((awayTeam?.shortName || awayTeam?.name || 'Away').slice(0, 45))
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(2)
                        .setRequired(true),
                ),
            );

        await interaction.showModal(modal);
        return;
    }

    const opsMatch = [ACTIONS.POSTPONE, ACTIONS.CANCEL, ACTIONS.RESUME]
        .map((action) => ({ action, prefix: `${action}:` }))
        .find(({ prefix }) => parsed.action.startsWith(prefix));

    if (opsMatch) {
        const matchId = parsed.action.slice(opsMatch.prefix.length);
        const actionMap = {
            [ACTIONS.POSTPONE]: 'postpone',
            [ACTIONS.CANCEL]: 'cancel',
            [ACTIONS.RESUME]: 'resume',
        };

        await interaction.deferUpdate();

        try {
            const lockKey = leagueLockKey(guildId, parsed.slug, LEAGUE_WRITE_SCOPE);

            await withOperationLock(lockKey, async () => {
                await MatchService.setMatchStatusByMatchId(guildId, interaction.user.id, parsed.slug, {
                    matchId,
                    action: actionMap[opsMatch.action],
                });
            });

            const payload = await buildChampionsScorePayload({
                guildId,
                slug: parsed.slug,
                tr,
                page: parsed.page,
                actorId: interaction.user.id,
            });

            await editChampionsScoreMessage(interaction, payload);

            try {
                await interaction.followUp({
                    content: tr(`handlers.match.${actionMap[opsMatch.action]}.success`, {
                        home: '?',
                        away: '?',
                        round: parsed.page,
                    }),
                    ephemeral: true,
                });
            } catch {
                // interaction already closed
            }

            markInteractionHandled(interaction.id);
        } catch (err) {
            const content = err instanceof LeagueError
                ? tr(`errors.${err.code}`, err.params)
                : tr('errors.GENERIC_LEAGUE_ERROR');

            try {
                await interaction.followUp({ content, ephemeral: true });
            } catch {
                // interaction already closed
            }
        }

        return;
    }

    await interaction.deferUpdate();

    let targetPage = parsed.page;

    if (parsed.action === ACTIONS.PREV_PAGE) {
        targetPage = Math.max(1, parsed.page - 1);
    } else if (parsed.action === ACTIONS.NEXT_PAGE) {
        targetPage = parsed.page + 1;
    }

    try {
        const payload = await buildChampionsScorePayload({
            guildId,
            slug: parsed.slug,
            tr,
            page: targetPage,
            actorId: interaction.user.id,
        });

        await editChampionsScoreMessage(interaction, payload);
        markInteractionHandled(interaction.id);
    } catch (err) {
        console.warn('[championsScoreNav] button failed:', err?.stack || err?.message || err);

        const content = err instanceof LeagueError
            ? tr(`errors.${err.code}`, err.params)
            : tr('errors.GENERIC_LEAGUE_ERROR');

        try {
            await interaction.followUp({ content, ephemeral: true });
        } catch {
            // interaction already closed
        }
    }
}

async function handleChampionsScoreMatchSelect(client, interaction) {
    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
    const { sendCompact } = require('../../ui/ReplyService');

    if (isDuplicateInteraction(interaction.id)) {
        return;
    }

    const parsed = parseChampionsScoreSelectId(interaction.customId);
    const matchId = interaction.values[0];

    if (!parsed || !matchId || matchId === 'none') {
        return;
    }

    markInteractionHandled(interaction.id);

    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guildId = interaction.guild?.id;

    if (!guildId) {
        return;
    }

    try {
        const match = await MatchRepository.findById(matchId);

        if (!match?.tournamentId) {
            throw new LeagueError('MATCH_NOT_FOUND');
        }

        const league = await LeagueService.resolveLeague(guildId, parsed.slug);

        if (match.leagueId.toString() !== league._id.toString()) {
            throw new LeagueError('MATCH_NOT_FOUND');
        }

        if (!PermissionService.canReportScore(league, interaction.user.id)) {
            await sendCompact(interaction, {
                tr,
                description: tr('errors.PERMISSION_DENIED_SCORE'),
                tone: 'warning',
                ephemeral: true,
            });
            return;
        }

        if (!SUBMITTABLE_STATUSES.includes(match.status)) {
            await sendCompact(interaction, {
                tr,
                description: tr('errors.MATCH_ALREADY_PROCESSED'),
                tone: 'warning',
                ephemeral: true,
            });
            return;
        }

        const [homeTeam, awayTeam] = await Promise.all([
            TeamRepository.findById(match.homeTeamId),
            TeamRepository.findById(match.awayTeamId),
        ]);

        const homeName = homeTeam?.shortName || homeTeam?.name || tr('format.fixture.home');
        const awayName = awayTeam?.shortName || awayTeam?.name || tr('format.fixture.away');
        const modalTitle = tr('handlers.scoreEntry.modalTitle', { home: homeName, away: awayName }).slice(0, 45);

        const modal = new ModalBuilder()
            .setCustomId(encodeChampionsScoreModalId(parsed.slug, parsed.page, matchId))
            .setTitle(modalTitle)
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('home_goals')
                        .setLabel(homeName.slice(0, 45))
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(2)
                        .setRequired(true)
                        .setPlaceholder('0'),
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('away_goals')
                        .setLabel(awayName.slice(0, 45))
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(2)
                        .setRequired(true)
                        .setPlaceholder('0'),
                ),
            );

        await interaction.showModal(modal);
    } catch (err) {
        console.warn('[championsScoreNav] select failed:', err?.stack || err?.message || err);

        const content = err instanceof LeagueError
            ? tr(`errors.${err.code}`, err.params)
            : tr('errors.GENERIC_LEAGUE_ERROR');

        await sendCompact(interaction, {
            tr,
            description: content,
            tone: 'danger',
            ephemeral: true,
        });
    }
}

async function handleChampionsScoreModalSubmit(client, interaction) {
    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');

    if (isDuplicateInteraction(interaction.id)) {
        return;
    }

    const parsed = parseChampionsScoreModalId(interaction.customId);

    if (!parsed) {
        return;
    }

    await interaction.deferUpdate();

    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guildId = interaction.guild?.id;

    if (!guildId) {
        return;
    }

    const homeGoals = Number.parseInt(interaction.fields.getTextInputValue('home_goals'), 10);
    const awayGoals = Number.parseInt(interaction.fields.getTextInputValue('away_goals'), 10);

    try {
        const lockKey = leagueLockKey(guildId, parsed.slug, LEAGUE_WRITE_SCOPE);

        await withOperationLock(lockKey, async () => {
            await MatchService.submitResultByMatchId(guildId, interaction.user.id, parsed.slug, {
                matchId: parsed.matchId,
                homeGoals,
                awayGoals,
            });
        });

        const payload = await buildChampionsScorePayload({
            guildId,
            slug: parsed.slug,
            tr,
            page: parsed.page,
            actorId: interaction.user.id,
        });

        await editChampionsScoreMessage(interaction, payload);

        try {
            await interaction.followUp({
                content: tr('handlers.scoreEntry.savedToast'),
                ephemeral: true,
            });
        } catch {
            // interaction already closed
        }

        markInteractionHandled(interaction.id);
    } catch (err) {
        console.warn('[championsScoreNav] modal failed:', err?.stack || err?.message || err);

        const content = err instanceof LeagueError
            ? tr(`errors.${err.code}`, err.params)
            : tr('errors.GENERIC_LEAGUE_ERROR');

        try {
            await interaction.followUp({ content, ephemeral: true });
        } catch {
            // interaction already closed
        }
    }
}

async function handleChampionsPenModalSubmit(client, interaction) {
    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');

    if (isDuplicateInteraction(interaction.id)) {
        return;
    }

    const parsed = parseChampionsPenModalId(interaction.customId);

    if (!parsed) {
        return;
    }

    await interaction.deferUpdate();

    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guildId = interaction.guild?.id;

    if (!guildId) {
        return;
    }

    const penaltiesHome = Number.parseInt(interaction.fields.getTextInputValue('penalties_home'), 10);
    const penaltiesAway = Number.parseInt(interaction.fields.getTextInputValue('penalties_away'), 10);

    try {
        const lockKey = leagueLockKey(guildId, parsed.slug, LEAGUE_WRITE_SCOPE);

        await withOperationLock(lockKey, async () => {
            await MatchService.submitPenalties(guildId, interaction.user.id, parsed.slug, {
                matchId: parsed.matchId,
                penaltiesHome,
                penaltiesAway,
            });
        });

        const payload = await buildChampionsScorePayload({
            guildId,
            slug: parsed.slug,
            tr,
            page: parsed.page,
            actorId: interaction.user.id,
        });

        await editChampionsScoreMessage(interaction, payload);

        try {
            await interaction.followUp({
                content: tr('handlers.champions.score.penaltiesSaved'),
                ephemeral: true,
            });
        } catch {
            // interaction already closed
        }

        markInteractionHandled(interaction.id);
    } catch (err) {
        console.warn('[championsScoreNav] penalties failed:', err?.stack || err?.message || err);

        const content = err instanceof LeagueError
            ? tr(`errors.${err.code}`, err.params)
            : tr('errors.GENERIC_LEAGUE_ERROR');

        try {
            await interaction.followUp({ content, ephemeral: true });
        } catch {
            // interaction already closed
        }
    }
}

module.exports = {
    CHAMPIONS_SCORE_PREFIX,
    ACTIONS,
    encodeChampionsScoreNavId,
    parseChampionsScoreNavId,
    encodeChampionsScoreSelectId,
    parseChampionsScoreSelectId,
    encodeChampionsScoreModalId,
    parseChampionsScoreModalId,
    encodeChampionsPenModalId,
    parseChampionsPenModalId,
    buildChampionsScorePayload,
    handleChampionsScoreNavButton,
    handleChampionsScoreMatchSelect,
    handleChampionsOpsMatchSelect,
    handleChampionsScoreModalSubmit,
    handleChampionsPenModalSubmit,
};
