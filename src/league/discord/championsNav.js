const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require('discord.js');
const LeagueError = require('../errors/LeagueError');
const TournamentService = require('../services/TournamentService');
const TeamRepository = require('../repositories/TeamRepository');
const MatchRepository = require('../repositories/MatchRepository');
const { formatStandingsTable } = require('../utils/formatStandings');
const { formatKnockoutBracket, formatTournamentStatus } = require('../utils/formatChampions');
const { buildStandingsV2Reply, stripLeagueReplyMeta } = require('../utils/visualV2Reply');
const { renderStandingsVisual } = require('../utils/visualHelpers');
const { enrichTeamMap } = require('../utils/teamMap');
const { buildStandingsView } = require('../render/data/standingsView');
const { normalizeDeliverPayload } = require('../../ui/ReplyService');
const { TOURNAMENT_STATUS } = require('../constants/tournamentStatus');

const CHAMPIONS_NAV_PREFIX = 'lcl:';

const ACTIONS = {
    STATUS: 'st',
    STANDINGS: 'gs',
    BRACKET: 'br',
    PREV_GROUP: 'pg',
    NEXT_GROUP: 'ng',
};

/**
 * @param {string} slug
 * @param {string} action
 * @param {string} [extra]
 */
function encodeChampionsNavId(slug, action, extra = '') {
    return `${CHAMPIONS_NAV_PREFIX}${slug}:${action}${extra ? `:${extra}` : ''}`;
}

/**
 * @param {string} customId
 */
function parseChampionsNavId(customId) {
    if (!customId.startsWith(CHAMPIONS_NAV_PREFIX)) {
        return null;
    }

    const body = customId.slice(CHAMPIONS_NAV_PREFIX.length);
    const parts = body.split(':');

    if (parts.length < 2) {
        return null;
    }

    const slug = parts[0];
    const action = parts[1];
    const extra = parts[2] || null;

    return { slug, action, extra };
}

/**
 * @param {object} input
 */
async function buildChampionsStatusPayload(input) {
    const { guildId, slug, tr, client } = input;
    const { league, tournament, qualifiedPreview, teamMap } = await TournamentService.getTournamentState(
        guildId,
        slug,
    );

    if (!league.championsLeague?.enabled) {
        throw new LeagueError('CL_NOT_ENABLED');
    }

    const lines = [
        tr('handlers.champions.settings.enabled'),
        tr('handlers.champions.settings.spots', { spots: league.championsLeague.qualifyingSpots || 4 }),
    ];

    if (tournament) {
        lines.push(formatTournamentStatus(tournament, tr));

        if (tournament.status === TOURNAMENT_STATUS.COMPLETED && tournament.winnerTeamId) {
            const winner = teamMap?.get(tournament.winnerTeamId.toString());
            lines.push(tr('handlers.champions.winner', { team: winner?.name || tr('common.unknown') }));
        }
    } else if (league.status === 'completed') {
        lines.push(tr('handlers.champions.pendingStart'));
    } else {
        lines.push(tr('handlers.champions.awaitingSeasonEnd'));

        if (qualifiedPreview?.length) {
            const teams = await TeamRepository.listActiveByLeague(league._id);
            const map = new Map(teams.map((t) => [t._id.toString(), t]));
            const preview = qualifiedPreview
                .map((q) => `#${q.seed} ${map.get(q.teamId.toString())?.name || '?'}`)
                .join('\n');
            lines.push(tr('handlers.champions.qualificationPreview', { teams: preview }));
        }
    }

    const navRows = buildChampionsNavRows({ tr, slug, view: ACTIONS.STATUS });

    return normalizeDeliverPayload({
        content: lines.join('\n'),
        components: navRows,
    });
}

/**
 * @param {object} input
 */
async function buildChampionsGroupStandingsPayload(input) {
    const { guildId, slug, tr, client, groupIndex = 0 } = input;
    const { league, tournament, standings } = await TournamentService.getGroupStandings(guildId, slug);

    if (!tournament.groups?.length) {
        throw new LeagueError('CL_NO_GROUP_STAGE');
    }

    const index = Math.max(0, Math.min(groupIndex, tournament.groups.length - 1));
    const group = tournament.groups[index];
    const groupStanding = standings.find((s) => s.groupId === group.id);
    const teams = await TeamRepository.listActiveByLeague(league._id);
    const teamMap = await enrichTeamMap(new Map(teams.map((t) => [t._id.toString(), t])), client);

    const tableText = formatStandingsTable(
        groupStanding || { entries: [] },
        teamMap,
        tr,
    );

    const title = tr('handlers.champions.groupTitle', { group: group.id });
    let visualPayload = null;

    if (groupStanding?.entries?.length) {
        const view = buildStandingsView(
            { ...league, name: `${league.name} — ${title}` },
            groupStanding,
            teamMap,
            { tr, page: 1 },
        );
        const buffer = await renderStandingsVisual(
            league,
            groupStanding,
            teamMap,
            { tr, page: 1 },
        );

        if (buffer) {
            visualPayload = buildStandingsV2Reply({
                tr,
                league,
                buffer,
                filename: `cl-group-${group.id}.png`,
                navRows: buildChampionsNavRows({ tr, slug, view: ACTIONS.STANDINGS, groupIndex: index }),
            });
        }
    }

    if (visualPayload) {
        return stripLeagueReplyMeta(visualPayload);
    }

    return normalizeDeliverPayload({
        content: `${title}\n${tableText}`,
        components: buildChampionsNavRows({ tr, slug, view: ACTIONS.STANDINGS, groupIndex: index }),
    });
}

/**
 * @param {object} input
 */
async function buildChampionsBracketPayload(input) {
    const { guildId, slug, tr, client } = input;
    const { league, tournament, teamMap, matches } = await TournamentService.getKnockoutBracket(
        guildId,
        slug,
    );

    const teams = await TeamRepository.listActiveByLeague(league._id);
    const enriched = await enrichTeamMap(
        teamMap || new Map(teams.map((t) => [t._id.toString(), t])),
        client,
    );

    const bracket = formatKnockoutBracket(tournament, enriched, matches, tr);

    return normalizeDeliverPayload({
        content: bracket,
        components: buildChampionsNavRows({ tr, slug, view: ACTIONS.BRACKET }),
    });
}

/**
 * @param {object} input
 */
function buildChampionsNavRows(input) {
    const { tr, slug, view, groupIndex = 0 } = input;

    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(encodeChampionsNavId(slug, ACTIONS.STATUS))
                .setLabel(tr('handlers.champions.nav.status'))
                .setStyle(view === ACTIONS.STATUS ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setEmoji('🏆'),
            new ButtonBuilder()
                .setCustomId(encodeChampionsNavId(slug, ACTIONS.STANDINGS, String(groupIndex)))
                .setLabel(tr('handlers.champions.nav.groups'))
                .setStyle(view === ACTIONS.STANDINGS ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setEmoji('📊'),
            new ButtonBuilder()
                .setCustomId(encodeChampionsNavId(slug, ACTIONS.BRACKET))
                .setLabel(tr('handlers.champions.nav.bracket'))
                .setStyle(view === ACTIONS.BRACKET ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setEmoji('🗂️'),
        ),
    ];
}

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleChampionsNavButton(client, interaction) {
    const parsed = parseChampionsNavId(interaction.customId);

    if (!parsed) {
        return;
    }

    const { resolveLocaleFromInteraction, createTranslator } = require('../../i18n');
    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const guildId = interaction.guild.id;

    await interaction.deferUpdate();

    let payload;

    if (parsed.action === ACTIONS.STANDINGS) {
        payload = await buildChampionsGroupStandingsPayload({
            guildId,
            slug: parsed.slug,
            tr,
            client,
            groupIndex: Number(parsed.extra) || 0,
        });
    } else if (parsed.action === ACTIONS.BRACKET) {
        payload = await buildChampionsBracketPayload({
            guildId,
            slug: parsed.slug,
            tr,
            client,
        });
    } else {
        payload = await buildChampionsStatusPayload({
            guildId,
            slug: parsed.slug,
            tr,
            client,
        });
    }

    await interaction.editReply(stripLeagueReplyMeta(payload));
}

module.exports = {
    CHAMPIONS_NAV_PREFIX,
    ACTIONS,
    encodeChampionsNavId,
    parseChampionsNavId,
    buildChampionsStatusPayload,
    buildChampionsGroupStandingsPayload,
    buildChampionsBracketPayload,
    handleChampionsNavButton,
};
