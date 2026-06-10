const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const FixtureService = require('../services/FixtureService');
const LeagueService = require('../services/LeagueService');
const MatchService = require('../services/MatchService');
const PermissionService = require('../services/PermissionService');
const RenderService = require('../render/services/RenderService');
const { enrichTeamMap } = require('../utils/teamMap');
const { tryRender } = require('../utils/renderReply');
const { paginateTable } = require('../render/drawing/paginateTable');
const LAYOUT = require('../render/constants/layout');
const { SUBMITTABLE_STATUSES } = require('../match/constants');
const { ACTIONS, resolveNavTarget } = require('./fixtureNav');
const { normalizeDeliverPayload } = require('../../ui/ReplyService');
const { buildScoreEntryV2Reply, stripLeagueReplyMeta } = require('../utils/visualV2Reply');
const LeagueError = require('../errors/LeagueError');
const { leagueLockKey } = require('./operationLock');
const { LEAGUE_WRITE_SCOPE } = require('./constants');
const { withOperationLock } = require('./operationLock');
const MatchRepository = require('../repositories/MatchRepository');
const TeamRepository = require('../repositories/TeamRepository');

const SCORE_NAV_PREFIX = 'lsc:';
const SCORE_SELECT_PREFIX = 'lsc:sel:';
const SCORE_MODAL_PREFIX = 'lsc:mdl:';

/**
 * @param {string} slug
 * @param {number} round
 * @param {number} page
 * @param {string} action
 */
function encodeScoreNavId(slug, round, page, action) {
    return `${SCORE_NAV_PREFIX}${slug}:${round}:${page}:${action}`;
}

/**
 * @param {string} customId
 */
function parseScoreNavId(customId) {
    if (!customId.startsWith(SCORE_NAV_PREFIX)
        || customId.startsWith(SCORE_SELECT_PREFIX)
        || customId.startsWith(SCORE_MODAL_PREFIX)) {
        return null;
    }

    const body = customId.slice(SCORE_NAV_PREFIX.length);
    const lastColon = body.lastIndexOf(':');
    if (lastColon <= 0) return null;

    const action = body.slice(lastColon + 1);
    const rest = body.slice(0, lastColon);

    const pageColon = rest.lastIndexOf(':');
    if (pageColon <= 0) return null;

    const page = Number(rest.slice(pageColon + 1));
    const roundRest = rest.slice(0, pageColon);

    const roundColon = roundRest.lastIndexOf(':');
    if (roundColon <= 0) return null;

    const round = Number(roundRest.slice(roundColon + 1));
    const slug = roundRest.slice(0, roundColon);

    if (!slug || !Number.isFinite(round) || !Number.isFinite(page)) {
        return null;
    }

    return { slug, round, page, action };
}

/**
 * @param {string} slug
 * @param {number} round
 * @param {number} page
 */
function encodeScoreSelectId(slug, round, page) {
    return `${SCORE_SELECT_PREFIX}${slug}:${round}:${page}`;
}

/**
 * @param {string} customId
 */
function parseScoreSelectId(customId) {
    if (!customId.startsWith(SCORE_SELECT_PREFIX)) {
        return null;
    }

    const body = customId.slice(SCORE_SELECT_PREFIX.length);
    const pageColon = body.lastIndexOf(':');
    if (pageColon <= 0) return null;

    const page = Number(body.slice(pageColon + 1));
    const roundRest = body.slice(0, pageColon);

    const roundColon = roundRest.lastIndexOf(':');
    if (roundColon <= 0) return null;

    const round = Number(roundRest.slice(roundColon + 1));
    const slug = roundRest.slice(0, roundColon);

    if (!slug || !Number.isFinite(round) || !Number.isFinite(page)) {
        return null;
    }

    return { slug, round, page };
}

/**
 * @param {string} slug
 * @param {number} round
 * @param {number} page
 * @param {string} matchId
 */
function encodeScoreModalId(slug, round, page, matchId) {
    return `${SCORE_MODAL_PREFIX}${slug}:${round}:${page}:${matchId}`;
}

/**
 * @param {string} customId
 */
function parseScoreModalId(customId) {
    if (!customId.startsWith(SCORE_MODAL_PREFIX)) {
        return null;
    }

    const body = customId.slice(SCORE_MODAL_PREFIX.length);
    const matchColon = body.lastIndexOf(':');
    if (matchColon <= 0) return null;

    const matchId = body.slice(matchColon + 1);
    const rest = body.slice(0, matchColon);

    const pageColon = rest.lastIndexOf(':');
    if (pageColon <= 0) return null;

    const page = Number(rest.slice(pageColon + 1));
    const roundRest = rest.slice(0, pageColon);

    const roundColon = roundRest.lastIndexOf(':');
    if (roundColon <= 0) return null;

    const round = Number(roundRest.slice(roundColon + 1));
    const slug = roundRest.slice(0, roundColon);

    if (!slug || !matchId || !Number.isFinite(round) || !Number.isFinite(page)) {
        return null;
    }

    return { slug, round, page, matchId };
}

/**
 * @param {object} input
 */
function buildScoreNavRows(input) {
    const { tr, slug, round, totalRounds, page, totalPages } = input;

    const rows = [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(encodeScoreNavId(slug, round, page, ACTIONS.PREV_ROUND))
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(round <= 1),
            new ButtonBuilder()
                .setCustomId(encodeScoreNavId(slug, round, page, 'wk'))
                .setLabel(tr('handlers.scoreEntry.nav.weekLabel', { round, total: totalRounds }))
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(encodeScoreNavId(slug, round, page, ACTIONS.NEXT_ROUND))
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(round >= totalRounds),
        ),
    ];

    if (totalPages > 1) {
        rows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeScoreNavId(slug, round, page, ACTIONS.PREV_PAGE))
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page <= 1),
                new ButtonBuilder()
                    .setCustomId(encodeScoreNavId(slug, round, page, 'pg'))
                    .setLabel(tr('handlers.scoreEntry.nav.pageLabel', { page, total: totalPages }))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(encodeScoreNavId(slug, round, page, ACTIONS.NEXT_PAGE))
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= totalPages),
            ),
        );
    }

    return rows;
}

/**
 * @param {object} input
 * @param {object[]} input.pageMatches
 * @param {Map<string, { name: string, shortName?: string }>} input.teamMap
 * @param {Function} input.tr
 * @param {string} input.slug
 * @param {number} input.round
 * @param {number} input.page
 * @param {boolean} input.canReport
 */
function buildScoreSelectRow(input) {
    const { pageMatches, teamMap, tr, slug, round, page, canReport } = input;
    const pending = pageMatches.filter((match) => SUBMITTABLE_STATUSES.includes(match.status));

    const menu = new StringSelectMenuBuilder()
        .setCustomId(encodeScoreSelectId(slug, round, page))
        .setPlaceholder(
            pending.length > 0
                ? tr('handlers.scoreEntry.selectPlaceholder')
                : tr('handlers.scoreEntry.selectEmpty'),
        )
        .setDisabled(!canReport || pending.length === 0);

    for (const match of pending.slice(0, 25)) {
        const home = teamMap.get(match.homeTeamId.toString());
        const away = teamMap.get(match.awayTeamId.toString());
        const homeName = home?.shortName || home?.name || tr('format.fixture.home');
        const awayName = away?.shortName || away?.name || tr('format.fixture.away');
        const legSuffix = match.leg > 1 ? tr('handlers.scoreEntry.selectLeg', { leg: match.leg }) : '';
        const label = tr('handlers.scoreEntry.selectOption', { home: homeName, away: awayName, leg: legSuffix });

        menu.addOptions({
            label: label.slice(0, 100),
            value: match._id.toString(),
        });
    }

    if (pending.length === 0) {
        menu.addOptions({
            label: tr('handlers.scoreEntry.selectNoPending').slice(0, 100),
            value: 'none',
        });
    }

    return new ActionRowBuilder().addComponents(menu);
}

/**
 * @param {object} input
 */
async function buildScoreEntryPayload(input) {
    const {
        guildId,
        slug,
        locale,
        tr,
        client,
        actorId,
        useVisual = true,
    } = input;

    const { league, round: targetRound, matches, teamMap, byeTeams } =
        await FixtureService.getFixture(guildId, slug, input.round ?? undefined);

    const pageInfo = paginateTable(matches, {
        page: input.page ?? 1,
        pageSize: LAYOUT.maxFixtureRowsPerPage,
    });

    const page = pageInfo.page;
    const totalPages = pageInfo.totalPages;
    const totalRounds = league.totalRounds || targetRound;
    const canReport = PermissionService.canReportScore(league, actorId);

    const navRows = buildScoreNavRows({
        tr,
        slug,
        round: targetRound,
        totalRounds,
        page,
        totalPages,
    });

    const selectRow = buildScoreSelectRow({
        pageMatches: pageInfo.rows,
        teamMap,
        tr,
        slug,
        round: targetRound,
        page,
        canReport,
    });

    const actionRows = [...navRows, selectRow];
    const pageLabel = page > 1 ? tr('common.pageLabel', { page }) : '';
    const titleParams = {
        name: league.name,
        round: targetRound,
        totalRounds,
        pageLabel,
    };

    if (matches.length === 0) {
        return {
            empty: true,
            round: targetRound,
            ...buildScoreEntryV2Reply({
                tr,
                slug,
                page,
                totalPages,
                titleParams,
                fallbackContent: tr('handlers.scoreEntry.noMatches', {
                    round: targetRound,
                    slug,
                }),
                actionRows,
                canReport,
            }),
        };
    }

    let renderResult = null;

    if (useVisual) {
        const enrichedTeamMap = await enrichTeamMap(teamMap, client);
        renderResult = await tryRender(() =>
            RenderService.renderFixture(league, targetRound, matches, enrichedTeamMap, byeTeams, {
                page,
                locale,
                tr,
            }),
        );
    }

    const lines = pageInfo.rows.map((match) => {
        const home = teamMap.get(match.homeTeamId.toString());
        const away = teamMap.get(match.awayTeamId.toString());
        return `${home?.shortName || home?.name || '?'} vs ${away?.shortName || away?.name || '?'}`;
    });
    const byeLine = byeTeams.length > 0
        ? tr('handlers.fixture.show.bye', { teams: byeTeams.join(', ') })
        : '';
    const fallbackContent = [...lines, byeLine].filter(Boolean).join('\n');

    return buildScoreEntryV2Reply({
        tr,
        slug,
        page,
        totalPages,
        titleParams,
        fallbackContent,
        renderResult,
        actionRows,
        canReport,
    });
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').InteractionReplyOptions} payload
 */
async function editScoreEntryMessage(interaction, payload) {
    const normalized = normalizeDeliverPayload(stripLeagueReplyMeta(payload));

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(normalized);
        return;
    }

    await interaction.update(normalized);
}

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleScoreNavButton(client, interaction) {
    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');

    if (isDuplicateInteraction(interaction.id)) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate().catch(() => {});
        }

        return;
    }

    const parsed = parseScoreNavId(interaction.customId);
    if (!parsed || parsed.action === 'wk' || parsed.action === 'pg') {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate().catch(() => {});
        }
        return;
    }

    await interaction.deferUpdate();

    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guildId = interaction.guild?.id;

    if (!guildId) {
        return;
    }

    try {
        const fixtureData = await FixtureService.getFixture(guildId, parsed.slug, parsed.round);
        const { league, matches } = fixtureData;

        const pageInfo = paginateTable(matches, {
            page: parsed.page,
            pageSize: LAYOUT.maxFixtureRowsPerPage,
        });

        const totalRounds = league.totalRounds || parsed.round;
        const target = resolveNavTarget(
            parsed.action,
            parsed.round,
            parsed.page,
            totalRounds,
            pageInfo.totalPages,
        );

        const payload = await buildScoreEntryPayload({
            guildId,
            slug: parsed.slug,
            round: target.round,
            page: target.page,
            locale,
            tr,
            client,
            actorId: interaction.user.id,
            useVisual: true,
        });

        await editScoreEntryMessage(interaction, payload);
        markInteractionHandled(interaction.id);
    } catch (err) {
        console.warn('[scoreNav] button failed:', err?.stack || err?.message || err);

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

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 */
async function handleScoreMatchSelect(client, interaction) {
    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
    const { sendCompact } = require('../../ui/ReplyService');

    if (isDuplicateInteraction(interaction.id)) {
        return;
    }

    const parsed = parseScoreSelectId(interaction.customId);
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
        if (!match) {
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
            .setCustomId(encodeScoreModalId(parsed.slug, parsed.round, parsed.page, matchId))
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
        console.warn('[scoreNav] select failed:', err?.stack || err?.message || err);

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

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleScoreModalSubmit(client, interaction) {
    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');

    if (isDuplicateInteraction(interaction.id)) {
        return;
    }

    const parsed = parseScoreModalId(interaction.customId);
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

        let submitResult;

        await withOperationLock(lockKey, async () => {
            submitResult = await MatchService.submitResultByMatchId(guildId, interaction.user.id, parsed.slug, {
                matchId: parsed.matchId,
                homeGoals,
                awayGoals,
            });
        });

        const { announceMatchResult } = require('./announcements');
        await announceMatchResult(client, {
            league: submitResult.league,
            match: submitResult.match,
            tr,
            locale,
            kind: 'submit',
        });

        const payload = await buildScoreEntryPayload({
            guildId,
            slug: parsed.slug,
            round: parsed.round,
            page: parsed.page,
            locale,
            tr,
            client,
            actorId: interaction.user.id,
            useVisual: true,
        });

        await editScoreEntryMessage(interaction, payload);

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
        console.warn('[scoreNav] modal failed:', err?.stack || err?.message || err);

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
    SCORE_NAV_PREFIX,
    SCORE_SELECT_PREFIX,
    SCORE_MODAL_PREFIX,
    encodeScoreNavId,
    parseScoreNavId,
    encodeScoreSelectId,
    parseScoreSelectId,
    encodeScoreModalId,
    parseScoreModalId,
    buildScoreEntryPayload,
    handleScoreNavButton,
    handleScoreMatchSelect,
    handleScoreModalSubmit,
};