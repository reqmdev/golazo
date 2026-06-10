const TeamRepository = require('../repositories/TeamRepository');
const { enrichTeamsWithLogoUrls } = require('./resolveTeamLogoUrl');

const TEAM_MAP_CACHE_TTL_MS = 10 * 60 * 1000;

/** @type {Map<string, { map: Map<string, object>, fingerprint: string, expiresAt: number }>} */
const teamMapCache = new Map();

/**
 * @param {object[]} teams
 */
function fingerprintTeams(teams) {
    return teams
        .map((team) => `${team._id}:${team.updatedAt || ''}:${team.logoUrl || ''}:${team.captainId || ''}`)
        .sort()
        .join('|');
}

/**
 * @param {import('mongoose').Types.ObjectId | string} leagueId
 */
function clearTeamMapCache(leagueId) {
    if (leagueId == null) {
        teamMapCache.clear();
        return;
    }

    teamMapCache.delete(leagueId.toString());
}

/**
 * @param {import('mongoose').Types.ObjectId | string} leagueId
 * @param {import('discord.js').Client | null} [client]
 */
async function buildTeamMap(leagueId, client = null) {
    const teams = await TeamRepository.listActiveByLeague(leagueId);
    const cacheKey = leagueId.toString();
    const fingerprint = fingerprintTeams(teams);
    const cached = teamMapCache.get(cacheKey);

    if (cached && cached.fingerprint === fingerprint && cached.expiresAt > Date.now()) {
        return cached.map;
    }

    const enriched = await enrichTeamsWithLogoUrls(client, teams);
    const map = new Map(enriched.map((team) => [team._id.toString(), team]));

    teamMapCache.set(cacheKey, {
        map,
        fingerprint,
        expiresAt: Date.now() + TEAM_MAP_CACHE_TTL_MS,
    });

    return map;
}

/**
 * Enrich an existing team map with logo URLs without re-querying the database.
 *
 * @param {Map<string, object>} teamMap
 * @param {import('discord.js').Client | null} [client]
 */
async function enrichTeamMap(teamMap, client = null) {
    if (!client || !teamMap?.size) {
        return teamMap;
    }

    const teams = [...teamMap.values()];
    const enriched = await enrichTeamsWithLogoUrls(client, teams);
    return new Map(enriched.map((team) => [team._id.toString(), team]));
}

module.exports = {
    buildTeamMap,
    enrichTeamMap,
    clearTeamMapCache,
};