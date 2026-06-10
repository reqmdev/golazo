const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const LeagueService = require('../services/LeagueService');
const TeamService = require('../services/TeamService');
const { renderTeamsVisual } = require('../utils/visualHelpers');
const { resolveTeamDisplayLabels } = require('../utils/resolveTeamLabels');
const { buildTeamListV2Reply } = require('../utils/visualV2Reply');
const { paginateTable } = require('../render/drawing/paginateTable');
const { CARD_PAGE_SIZES } = require('../constants/cardPageSize');
const { normalizeDeliverPayload } = require('../../ui/ReplyService');

const TEAM_LIST_NAV_PREFIX = 'ltm:';

const ACTIONS = {
    PREV_PAGE: 'pp',
    NEXT_PAGE: 'np',
};

/**
 * @param {string} slug
 * @param {number} page
 * @param {string} action
 */
function encodeTeamListNavId(slug, page, action) {
    return `${TEAM_LIST_NAV_PREFIX}${slug}:${page}:${action}`;
}

/**
 * @param {string} customId
 */
function parseTeamListNavId(customId) {
    if (!customId.startsWith(TEAM_LIST_NAV_PREFIX)) {
        return null;
    }

    const body = customId.slice(TEAM_LIST_NAV_PREFIX.length);
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
function resolveTeamListNavTarget(action, page, totalPages) {
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
function buildTeamListNavRows(input) {
    const { tr, slug, page, totalPages } = input;

    if (totalPages <= 1) {
        return [];
    }

    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(encodeTeamListNavId(slug, page, ACTIONS.PREV_PAGE))
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page <= 1),
            new ButtonBuilder()
                .setCustomId(encodeTeamListNavId(slug, page, 'pg'))
                .setLabel(tr('handlers.team.list.nav.pageLabel', { page, total: totalPages }))
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(encodeTeamListNavId(slug, page, ACTIONS.NEXT_PAGE))
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page >= totalPages),
        ),
    ];
}

/**
 * @param {object} input
 */
async function buildTeamListShowPayload(input) {
    const {
        guildId,
        slug,
        locale,
        tr,
        client,
        guild,
        page: inputPage = 1,
    } = input;

    const league = await LeagueService.resolveLeague(guildId, slug);
    const teams = await TeamService.listTeams(guildId, slug);
    const pageInfo = paginateTable(teams, {
        page: inputPage,
        pageSize: CARD_PAGE_SIZES.teamList,
    });
    const page = pageInfo.page;
    const totalPages = pageInfo.totalPages;

    const { captainLabels, roleLabels } = await resolveTeamDisplayLabels(
        client,
        guild,
        teams,
        tr,
    );

    const renderResult = await renderTeamsVisual(league, teams, {
        page,
        locale,
        tr,
        client,
        captainLabels,
        roleLabels,
    });

    const lines = teams.map((team) => {
        const captain = team.captainId ? `<@${team.captainId}>` : tr('common.emDash');
        return tr('handlers.team.list.item', {
            name: team.name,
            shortName: team.shortName,
            captain,
        });
    });

    const pageLabel = page > 1 ? tr('common.pageLabel', { page }) : '';

    return buildTeamListV2Reply({
        tr,
        slug,
        page,
        totalPages,
        teamCount: teams.length,
        titleParams: {
            name: league.name,
            slug,
            count: teams.length,
            pageLabel,
        },
        fallbackContent: `${tr('handlers.team.list.title', {
            name: league.name,
            slug,
            count: teams.length,
            pageLabel,
        })}\n${lines.join('\n')}`,
        renderResult,
        actionRows: buildTeamListNavRows({ tr, slug, page, totalPages }),
    });
}

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleTeamListNavButton(client, interaction) {
    const parsed = parseTeamListNavId(interaction.customId);

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

    if (!guildId || !interaction.guild) {
        return;
    }

    try {
        const teams = await TeamService.listTeams(guildId, parsed.slug);
        const totalPages = paginateTable(teams, {
            page: parsed.page,
            pageSize: CARD_PAGE_SIZES.teamList,
        }).totalPages;
        const target = resolveTeamListNavTarget(parsed.action, parsed.page, totalPages);

        const payload = await buildTeamListShowPayload({
            guildId,
            slug: parsed.slug,
            page: target.page,
            locale,
            tr,
            client,
            guild: interaction.guild,
        });

        await interaction.editReply(normalizeDeliverPayload(payload));
    } catch (err) {
        console.warn('[teamListNav] failed:', err?.stack || err?.message || err);
    }
}

module.exports = {
    TEAM_LIST_NAV_PREFIX,
    encodeTeamListNavId,
    parseTeamListNavId,
    buildTeamListShowPayload,
    handleTeamListNavButton,
};