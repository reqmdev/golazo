const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const StandingService = require('../services/StandingService');
const { enrichTeamMap } = require('../utils/teamMap');
const { renderStandingsVisual } = require('../utils/visualHelpers');
const { buildStandingsV2Reply, stripLeagueReplyMeta } = require('../utils/visualV2Reply');
const { formatStandingsTable } = require('../utils/formatStandings');
const { paginateTable } = require('../render/drawing/paginateTable');
const { normalizeDeliverPayload } = require('../../ui/ReplyService');
const LeagueError = require('../errors/LeagueError');

const STANDINGS_NAV_PREFIX = 'lst:';

const ACTIONS = {
    PREV_PAGE: 'pp',
    NEXT_PAGE: 'np',
};

/**
 * @param {string} slug
 * @param {number} page
 * @param {string} action
 */
function encodeStandingsNavId(slug, page, action) {
    return `${STANDINGS_NAV_PREFIX}${slug}:${page}:${action}`;
}

/**
 * @param {string} customId
 */
function parseStandingsNavId(customId) {
    if (!customId.startsWith(STANDINGS_NAV_PREFIX)) {
        return null;
    }

    const body = customId.slice(STANDINGS_NAV_PREFIX.length);
    const lastColon = body.lastIndexOf(':');
    if (lastColon <= 0) return null;

    const action = body.slice(lastColon + 1);
    const rest = body.slice(0, lastColon);

    const pageColon = rest.lastIndexOf(':');
    if (pageColon <= 0) return null;

    const page = Number(rest.slice(pageColon + 1));
    const slug = rest.slice(0, pageColon);

    if (!slug || !Number.isFinite(page)) {
        return null;
    }

    return { slug, page, action };
}

/**
 * @param {string} action
 * @param {number} page
 * @param {number} totalPages
 */
function resolveStandingsNavTarget(action, page, totalPages) {
    switch (action) {
        case ACTIONS.PREV_PAGE:
            return { page: Math.max(1, page - 1) };
        case ACTIONS.NEXT_PAGE:
            return { page: Math.min(totalPages, page + 1) };
        default:
            return { page };
    }
}

/**
 * @param {object} input
 */
function buildStandingsNavRows(input) {
    const { tr, slug, page, totalPages } = input;

    if (totalPages <= 1) {
        return [];
    }

    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(encodeStandingsNavId(slug, page, ACTIONS.PREV_PAGE))
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page <= 1),
            new ButtonBuilder()
                .setCustomId(encodeStandingsNavId(slug, page, 'pg'))
                .setLabel(tr('handlers.standings.nav.pageLabel', { page, total: totalPages }))
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(encodeStandingsNavId(slug, page, ACTIONS.NEXT_PAGE))
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page >= totalPages),
        ),
    ];
}

/**
 * @param {object} input
 */
async function buildStandingsShowPayload(input) {
    const {
        guildId,
        slug,
        locale,
        tr,
        client,
        page: inputPage = 1,
    } = input;

    const { league, standing, teamMap } = await StandingService.getStandings(guildId, slug);

    if (!league.fixtureGeneratedAt) {
        throw new LeagueError('NO_FIXTURE_VIEW');
    }

    const pageInfo = paginateTable(standing.entries ?? [], { page: inputPage });
    const page = pageInfo.page;
    const totalPages = pageInfo.totalPages;

    const navRows = buildStandingsNavRows({ tr, slug, page, totalPages });
    const pageLabel = page > 1 ? tr('common.pageLabel', { page }) : '';
    const titleParams = { name: league.name, pageLabel };

    const enrichedTeamMap = await enrichTeamMap(teamMap, client);
    const renderResult = await renderStandingsVisual(
        league,
        standing,
        enrichedTeamMap,
        { page, locale, tr },
    );

    return buildStandingsV2Reply({
        tr,
        titleKey: 'handlers.standings.title',
        titleParams,
        slug,
        page,
        totalPages,
        fallbackContent: formatStandingsTable(standing, teamMap, tr),
        renderResult,
        actionRows: navRows,
    });
}

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleStandingsNavButton(client, interaction) {
    const parsed = parseStandingsNavId(interaction.customId);

    if (!parsed || parsed.action === 'pg') {
        return;
    }

    const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
    const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');

    if (isDuplicateInteraction(interaction.id)) {
        return;
    }

    await interaction.deferUpdate();
    markInteractionHandled(interaction.id);

    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guildId = interaction.guild?.id;

    if (!guildId) {
        return;
    }

    try {
        const { league, standing } = await StandingService.getStandings(guildId, parsed.slug);
        const totalPages = paginateTable(standing.entries ?? [], { page: parsed.page }).totalPages;
        const target = resolveStandingsNavTarget(parsed.action, parsed.page, totalPages);

        const payload = await buildStandingsShowPayload({
            guildId,
            slug: parsed.slug,
            page: target.page,
            locale,
            tr,
            client,
        });

        await interaction.editReply(normalizeDeliverPayload(stripLeagueReplyMeta(payload)));
    } catch (err) {
        console.warn('[standingsNav] failed:', err?.stack || err?.message || err);
    }
}

module.exports = {
    STANDINGS_NAV_PREFIX,
    encodeStandingsNavId,
    parseStandingsNavId,
    resolveStandingsNavTarget,
    buildStandingsNavRows,
    buildStandingsShowPayload,
    handleStandingsNavButton,
};