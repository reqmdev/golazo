const mongoose = require('mongoose');
const { info, warn } = require('../utils/Console');
const { LEAGUE_STATUS } = require('../league/constants/leagueStatus');
const { clearRenderCacheByGuildId } = require('../league/render/core/RenderCache');

/**
 * @returns {'cache_only' | 'archive' | 'delete'}
 */
function resolveGuildLeaveDataPolicy() {
    const raw = (process.env.GOLAZO_GUILD_LEAVE_DATA_POLICY || 'cache_only').toLowerCase();

    if (raw === 'archive' || raw === 'delete') {
        return raw;
    }

    return 'cache_only';
}

/**
 * Purge in-memory guild-scoped caches on the bot client.
 * @param {import('../client/DiscordBot')} client
 * @param {string} guildId
 */
function purgeGuildClientCaches(client, guildId) {
    client.prefixCache?.delete(guildId);
    client.guildLocaleCache?.delete(guildId);
}

/**
 * @param {string} guildId
 */
function purgeGuildRenderCaches(guildId) {
    clearRenderCacheByGuildId(guildId);
}

/**
 * @param {string} guildId
 */
async function archiveGuildData(guildId) {
    const League = mongoose.model('League');
    const result = await League.updateMany(
        { guildId, status: { $ne: LEAGUE_STATUS.ARCHIVED } },
        { $set: { status: LEAGUE_STATUS.ARCHIVED } }
    ).exec();

    info(`Archived ${result.modifiedCount} league(s) for departed guild ${guildId}.`);
}

/**
 * @param {string} guildId
 */
async function deleteGuildData(guildId) {
    const League = mongoose.model('League');
    const Team = mongoose.model('Team');
    const Match = mongoose.model('Match');
    const Standing = mongoose.model('Standing');
    const LeagueAuditLog = mongoose.model('LeagueAuditLog');
    const LeagueOperationLock = mongoose.model('LeagueOperationLock');
    const GuildSettings = mongoose.model('GuildSettings');

    const leagues = await League.find({ guildId }).select('_id').lean().exec();
    const leagueIds = leagues.map((league) => league._id);

    if (leagueIds.length > 0) {
        await Promise.all([
            Match.deleteMany({ guildId }).exec(),
            Standing.deleteMany({ guildId }).exec(),
            Team.deleteMany({ guildId }).exec(),
            LeagueAuditLog.deleteMany({ guildId }).exec(),
            LeagueOperationLock.deleteMany({ leagueId: { $in: leagueIds } }).exec(),
            League.deleteMany({ guildId }).exec()
        ]);
    }

    await GuildSettings.deleteOne({ guildId }).exec();

    info(`Deleted league data for departed guild ${guildId} (${leagueIds.length} league(s)).`);
}

/**
 * @param {import('../client/DiscordBot')} client
 * @param {import('discord.js').Guild} guild
 */
async function handleGuildDelete(client, guild) {
    const guildId = guild.id;
    const guildName = guild.name || 'unknown';

    info(`Golazo removed from guild: ${guildName} (${guildId})`);

    purgeGuildClientCaches(client, guildId);

    try {
        purgeGuildRenderCaches(guildId);
    } catch (err) {
        warn(`Could not purge render caches for guild ${guildId}:`, err?.message || err);
    }

    const policy = resolveGuildLeaveDataPolicy();

    if (policy === 'cache_only') {
        return;
    }

    try {
        if (policy === 'archive') {
            await archiveGuildData(guildId);
        } else if (policy === 'delete') {
            await deleteGuildData(guildId);
        }
    } catch (err) {
        warn(`Guild leave data policy "${policy}" failed for ${guildId}:`, err?.message || err);
    }
}

module.exports = {
    resolveGuildLeaveDataPolicy,
    purgeGuildClientCaches,
    purgeGuildRenderCaches,
    archiveGuildData,
    deleteGuildData,
    handleGuildDelete
};