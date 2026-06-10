const { normalizeDeliverPayload } = require('../../ui/ReplyService');
const { buildMatchResultV2Reply } = require('../utils/visualV2Reply');
const { renderMatchVisual } = require('../utils/visualHelpers');
const { buildTeamMap } = require('../utils/teamMap');
const TeamRepository = require('../repositories/TeamRepository');

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {object} input
 */
async function announceMatchResult(client, input) {
    const {
        league,
        match,
        tr,
        locale,
        kind = 'submit',
    } = input;

    const channelId = league.channels?.announcementsChannelId;

    if (!channelId) {
        return;
    }

    let channel;

    try {
        channel = await client.channels.fetch(channelId);
    } catch {
        return;
    }

    if (!channel?.isTextBased?.()) {
        return;
    }

    const [homeTeam, awayTeam] = await Promise.all([
        TeamRepository.findById(match.homeTeamId),
        TeamRepository.findById(match.awayTeamId),
    ]);

    const home = homeTeam?.shortName || homeTeam?.name || tr('format.fixture.home');
    const away = awayTeam?.shortName || awayTeam?.name || tr('format.fixture.away');

    const titleKey = kind === 'correct'
        ? 'handlers.scoreCorrect.corrected'
        : kind === 'forfeit'
            ? 'handlers.forfeit.recorded'
            : 'handlers.score.saved';

    const walkoverWinnerId = match.meta?.walkoverWinnerId?.toString();
    const winnerName = walkoverWinnerId === homeTeam?._id?.toString()
        ? home
        : walkoverWinnerId === awayTeam?._id?.toString()
            ? away
            : home;

    const titleParams = kind === 'forfeit'
        ? { winner: winnerName }
        : {
            home,
            away,
            homeGoals: match.score?.home ?? 0,
            awayGoals: match.score?.away ?? 0,
        };

    const teamMap = await buildTeamMap(league._id, client);
    const renderResult = await renderMatchVisual(league, match, {
        locale,
        tr,
        client,
        label: kind === 'correct' ? tr('render.matchResult.corrected') : undefined,
    });

    const payload = buildMatchResultV2Reply({
        tr,
        slug: league.slug,
        leagueName: league.name,
        round: match.round,
        totalRounds: league.totalRounds || match.round,
        titleKey,
        titleParams,
        postImageHint: tr('handlers.announcements.hint', {
            round: match.round,
            leg: match.leg,
        }),
        renderResult,
    });

    try {
        await channel.send(normalizeDeliverPayload(payload));
    } catch (err) {
        console.warn('[announcements] send failed:', err?.stack || err?.message || err);
    }
}

module.exports = { announceMatchResult };