const AVATAR_URL_CACHE_TTL_MS = 30 * 60 * 1000;

/** @type {Map<string, { url: string, expiresAt: number }>} */
const avatarUrlCache = new Map();

function getCachedAvatarUrl(captainId) {
    const entry = avatarUrlCache.get(captainId);

    if (!entry || entry.expiresAt < Date.now()) {
        return null;
    }

    return entry.url;
}

function setCachedAvatarUrl(captainId, url) {
    avatarUrlCache.set(captainId, {
        url,
        expiresAt: Date.now() + AVATAR_URL_CACHE_TTL_MS,
    });
}

function clearAvatarUrlCache() {
    avatarUrlCache.clear();
}

/**
 * Resolve effective team logo URL: custom logo → captain avatar → none.
 *
 * @param {import('discord.js').Client} client
 * @param {object} team
 */
async function resolveTeamLogoUrl(client, team) {
    if (team.logoUrl) {
        return team.logoUrl;
    }

    if (!team.captainId || !client) {
        return null;
    }

    const cachedUrl = getCachedAvatarUrl(team.captainId);

    if (cachedUrl) {
        return cachedUrl;
    }

    const cachedUser = client.users?.cache?.get?.(team.captainId);

    if (cachedUser) {
        const url = cachedUser.displayAvatarURL({ extension: 'png', size: 128 });
        setCachedAvatarUrl(team.captainId, url);
        return url;
    }

    try {
        const user = await client.users.fetch(team.captainId);
        const url = user.displayAvatarURL({ extension: 'png', size: 128 });
        setCachedAvatarUrl(team.captainId, url);
        return url;
    } catch {
        return null;
    }
}

/**
 * @param {import('discord.js').Client | null | undefined} client
 * @param {object[]} teams
 */
async function enrichTeamsWithLogoUrls(client, teams) {
    if (!client || !Array.isArray(teams) || teams.length === 0) {
        return teams;
    }

    return Promise.all(
        teams.map(async (team) => {
            const logoUrl = await resolveTeamLogoUrl(client, team);

            if (!logoUrl || logoUrl === team.logoUrl) {
                return team;
            }

            return { ...team, logoUrl };
        }),
    );
}

module.exports = {
    resolveTeamLogoUrl,
    enrichTeamsWithLogoUrls,
    clearAvatarUrlCache,
};