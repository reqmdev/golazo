const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const FixtureService = require('../services/FixtureService');
const RenderService = require('../render/services/RenderService');
const { enrichTeamMap } = require('../utils/teamMap');
const { tryRender } = require('../utils/renderReply');
const { buildFixtureV2Reply, stripLeagueReplyMeta } = require('../utils/visualV2Reply');
const { paginateTable } = require('../render/drawing/paginateTable');
const LAYOUT = require('../render/constants/layout');
const { formatMatchLine } = require('../utils/formatFixture');
const { normalizeDeliverPayload } = require('../../ui/ReplyService');
const LeagueError = require('../errors/LeagueError');

const FIXTURE_NAV_PREFIX = 'lfx:';

const ACTIONS = {
    PREV_ROUND: 'pr',
    NEXT_ROUND: 'nr',
    PREV_PAGE: 'pp',
    NEXT_PAGE: 'np',
};

/**
 * @param {string} slug
 * @param {number} round
 * @param {number} page
 * @param {string} action
 */
function encodeFixtureNavId(slug, round, page, action) {
    return `${FIXTURE_NAV_PREFIX}${slug}:${round}:${page}:${action}`;
}

/**
 * @param {string} customId
 */
function parseFixtureNavId(customId) {
    if (!customId.startsWith(FIXTURE_NAV_PREFIX)) {
        return null;
    }

    const body = customId.slice(FIXTURE_NAV_PREFIX.length);
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
 * @param {object} input
 * @param {Function} input.tr
 * @param {number} input.round
 * @param {number} input.totalRounds
 * @param {number} input.page
 * @param {number} input.totalPages
 * @param {string} input.slug
 */
function buildFixtureNavRows(input) {
    const { tr, slug, round, totalRounds, page, totalPages } = input;
    const rows = [];

    const weekRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(encodeFixtureNavId(slug, round, page, ACTIONS.PREV_ROUND))
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(round <= 1),
        new ButtonBuilder()
            .setCustomId(encodeFixtureNavId(slug, round, page, 'wk'))
            .setLabel(tr('handlers.fixture.nav.weekLabel', { round, total: totalRounds }))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(false),
        new ButtonBuilder()
            .setCustomId(encodeFixtureNavId(slug, round, page, ACTIONS.NEXT_ROUND))
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(round >= totalRounds),
    );

    rows.push(weekRow);

    if (totalPages > 1) {
        rows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeFixtureNavId(slug, round, page, ACTIONS.PREV_PAGE))
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page <= 1),
                new ButtonBuilder()
                    .setCustomId(encodeFixtureNavId(slug, round, page, 'pg'))
                    .setLabel(tr('handlers.fixture.nav.pageLabel', { page, total: totalPages }))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(encodeFixtureNavId(slug, round, page, ACTIONS.NEXT_PAGE))
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= totalPages),
            ),
        );
    }

    return rows;
}

/**
 * @param {string} action
 * @param {number} round
 * @param {number} page
 * @param {number} totalRounds
 * @param {number} totalPages
 */
function resolveNavTarget(action, round, page, totalRounds, totalPages) {
    switch (action) {
        case ACTIONS.PREV_ROUND:
            return { round: Math.max(1, round - 1), page: 1 };
        case ACTIONS.NEXT_ROUND:
            return { round: Math.min(totalRounds, round + 1), page: 1 };
        case ACTIONS.PREV_PAGE:
            return { round, page: Math.max(1, page - 1) };
        case ACTIONS.NEXT_PAGE:
            return { round, page: Math.min(totalPages, page + 1) };
        default:
            return { round, page };
    }
}

/**
 * @param {object} input
 * @param {string} input.guildId
 * @param {string} input.slug
 * @param {number} [input.round]
 * @param {number} [input.page]
 * @param {string} input.locale
 * @param {Function} input.tr
 * @param {import('discord.js').Client} input.client
 * @param {boolean} [input.useVisual]
 */
async function buildFixtureShowPayload(input) {
    const {
        guildId,
        slug,
        locale,
        tr,
        client,
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

    const navRows = buildFixtureNavRows({
        tr,
        slug,
        round: targetRound,
        totalRounds,
        page,
        totalPages,
    });

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
            ...buildFixtureV2Reply({
                tr,
                slug,
                page,
                totalPages,
                titleParams,
                fallbackContent: tr('render.fixture.empty'),
                actionRows: navRows,
            }),
        };
    }

    const lines = pageInfo.rows.map((match) => formatMatchLine(match, teamMap, tr));
    const byeLine = byeTeams.length > 0
        ? tr('handlers.fixture.show.bye', { teams: byeTeams.join(', ') })
        : '';

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

    const fallbackContent = [...lines, byeLine].filter(Boolean).join('\n');

    return buildFixtureV2Reply({
        tr,
        slug,
        page,
        totalPages,
        titleParams,
        fallbackContent,
        renderResult,
        actionRows: navRows,
    });
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function acknowledgeFixtureNav(interaction) {
    if (interaction.deferred || interaction.replied) {
        return;
    }

    await interaction.deferUpdate();
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {import('discord.js').InteractionReplyOptions} payload
 */
async function editFixtureNavMessage(interaction, payload) {
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
async function handleFixtureNavButton(client, interaction) {
    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');

    if (isDuplicateInteraction(interaction.id)) {
        return;
    }

    const parsed = parseFixtureNavId(interaction.customId);
    if (!parsed || parsed.action === 'pg') {
        await acknowledgeFixtureNav(interaction).catch(() => {});
        return;
    }

    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);

    if (parsed.action === 'wk') {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder()
            .setCustomId(`lfx:jump:${parsed.slug}:${parsed.page}`)
            .setTitle(tr('handlers.fixture.nav.jumpTitle').slice(0, 45))
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('round')
                        .setLabel(tr('handlers.fixture.nav.jumpLabel').slice(0, 45))
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('1')
                        .setMinLength(1)
                        .setMaxLength(4)
                        .setRequired(true)
                )
            );
        await interaction.showModal(modal);
        return;
    }

    await acknowledgeFixtureNav(interaction);
    markInteractionHandled(interaction.id);

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

        const payload = await buildFixtureShowPayload({
            guildId,
            slug: parsed.slug,
            round: target.round,
            page: target.page,
            locale,
            tr,
            client,
            useVisual: true,
        });

        await editFixtureNavMessage(interaction, payload);
    } catch (err) {
        console.warn('[fixtureNav] button failed:', err?.stack || err?.message || err);

        const content = err instanceof LeagueError
            ? tr(`errors.${err.code}`, err.params)
            : tr('errors.GENERIC_LEAGUE_ERROR');

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({
                    content,
                    ephemeral: true,
                });
            }
        } catch {
            // interaction already closed
        }
    }
}

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleFixtureNavModalSubmit(client, interaction) {
    const customId = interaction.customId;
    if (!customId.startsWith('lfx:jump:')) return;

    const parts = customId.slice('lfx:jump:'.length).split(':');
    const slug = parts[0];
    const page = Number(parts[1] || 1);

    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guildId = interaction.guild?.id;

    if (!guildId) return;

    const roundInput = interaction.fields.getTextInputValue('round')?.trim();
    const roundNumber = Number(roundInput);

    await interaction.deferUpdate();

    try {
        const fixtureData = await FixtureService.getFixture(guildId, slug);
        const { league } = fixtureData;
        const totalRounds = league.totalRounds || 1;

        if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > totalRounds) {
            throw new LeagueError('INVALID_ROUND', { totalRounds });
        }

        const payload = await buildFixtureShowPayload({
            guildId,
            slug,
            round: roundNumber,
            page: 1, // reset page to 1 on round jump
            locale,
            tr,
            client,
            useVisual: true,
        });

        await editFixtureNavMessage(interaction, payload);
    } catch (err) {
        console.warn('[fixtureNav] modal submit failed:', err?.stack || err?.message || err);

        const content = err instanceof LeagueError
            ? tr(`errors.${err.code}`, err.params)
            : tr('errors.GENERIC_LEAGUE_ERROR');

        try {
            await interaction.followUp({
                content,
                ephemeral: true,
            });
        } catch {
            // ignore
        }
    }
}

module.exports = {
    FIXTURE_NAV_PREFIX,
    ACTIONS,
    encodeFixtureNavId,
    parseFixtureNavId,
    resolveNavTarget,
    buildFixtureNavRows,
    buildFixtureShowPayload,
    handleFixtureNavButton,
    handleFixtureNavModalSubmit,
};