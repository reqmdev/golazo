require('dotenv').config();

/**
 * @returns {string | undefined}
 */
function resolveOwnerId() {
    const fromEnv = process.env.GOLAZO_OWNER_ID || process.env.BOT_OWNER_ID;

    if (fromEnv?.trim()) {
        return fromEnv.trim();
    }

    return undefined;
}

/**
 * @param {string | undefined} ownerId
 * @returns {string[]}
 */
function resolveDeveloperIds(ownerId) {
    const raw = process.env.GOLAZO_DEVELOPER_IDS || process.env.BOT_DEVELOPER_IDS || '';

    const fromEnv = raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

    if (fromEnv.length > 0) {
        return fromEnv;
    }

    if (ownerId) {
        return [ownerId];
    }

    return [];
}

const ownerId = resolveOwnerId();

const config = {
    // MongoDB is now used for all persistent data (prefixes, future guild settings).
    // Connection string lives in .env as MONGODB_URI. No local path needed.
    development: {
        enabled: process.env.GOLAZO_DEV_MODE === 'true',
        guildId: process.env.GOLAZO_DEV_GUILD_ID || '',
    },
    commands: {
        prefix: '?', // For message commands, prefix is required. This can be changed per-guild via MongoDB (Golazo settings).
        message_commands: process.env.GOLAZO_MESSAGE_COMMANDS === 'true',
        application_commands: {
            chat_input: true, // If true, the bot will allow users to use chat input (or slash) commands.
            user_context: true, // If true, the bot will allow users to use user context menu commands.
            message_context: true // If true, the bot will allow users to use message context menu commands.
        }
    },
    users: {
        ownerId,
        developers: resolveDeveloperIds(ownerId)
    },
    render: {
        cacheEnabled: true,
        cacheTtlMs: 30 * 60 * 1000,
        cacheMaxEntries: 128,
        imageCacheTtlMs: 15 * 60 * 1000,
        imageCacheMaxEntries: 200,
        engine: process.env.RENDER_ENGINE || 'svg',
        svgCards: (process.env.RENDER_SVG_CARDS || 'match_result,standings,fixture,team_list')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    },
    i18n: {
        defaultLocale: 'en',
        supportedLocales: ['en', 'tr']
    },
    cache: {
        prefixMaxEntries: Number(process.env.GOLAZO_PREFIX_CACHE_MAX) || 5000,
        userLocaleMaxEntries: Number(process.env.GOLAZO_USER_LOCALE_CACHE_MAX) || 10_000,
        guildLocaleMaxEntries: Number(process.env.GOLAZO_GUILD_LOCALE_CACHE_MAX) || 5000,
        sweepIntervalMs: Number(process.env.GOLAZO_CACHE_SWEEP_MS) || 5 * 60 * 1000,
        interactionGuardMaxEntries: Number(process.env.GOLAZO_INTERACTION_GUARD_MAX) || 10_000
    },
    rateLimit: {
        render: {
            enabled: process.env.GOLAZO_RENDER_RATE_LIMIT_ENABLED !== 'false',
            maxRequests: Number(process.env.GOLAZO_RENDER_RATE_LIMIT) || 12,
            windowMs: Number(process.env.GOLAZO_RENDER_RATE_WINDOW_MS) || 60_000,
            maxKeys: Number(process.env.GOLAZO_RENDER_RATE_MAX_KEYS) || 20_000
        }
    }
}

module.exports = config;