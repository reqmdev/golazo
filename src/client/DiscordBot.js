const { Client, Collection, Partials, GatewayIntentBits } = require("discord.js");
const CommandsHandler = require("./handler/CommandsHandler");
const { warn, error, info, success } = require("../utils/Console");
const config = require("../config");
const { LruMap } = require("../utils/lruMap");
const { startCacheSweeper, stopAllCacheSweepers } = require("../utils/cacheSweeper");
const { getRenderRateLimiter } = require("../utils/interactionRateLimit");
const { normalizeLocale } = require("../i18n/normalize");
const CommandsListener = require("./handler/CommandsListener");
const ComponentsHandler = require("./handler/ComponentsHandler");
const ComponentsListener = require("./handler/ComponentsListener");
const EventsHandler = require("./handler/EventsHandler");
const { connectMongo } = require("../database/connect");
const mongoose = require("mongoose");

class DiscordBot extends Client {
    collection = {
        application_commands: new Collection(),
        message_commands: new Collection(),
        message_commands_aliases: new Collection(),
        components: {
            buttons: new Collection(),
            selects: new Collection(),
            modals: new Collection(),
            autocomplete: new Collection()
        }
    }
    rest_application_commands_array = [];
    login_attempts = 0;
    login_timestamp = 0;
    handlersLoaded = false;
    /** @type {NodeJS.Timeout | null} */
    statusInterval = null;

    // Bounded LRU caches for hot per-guild/user settings (backed by MongoDB).
    prefixCache = new LruMap({ maxSize: config.cache.prefixMaxEntries });
    userLocaleCache = new LruMap({ maxSize: config.cache.userLocaleMaxEntries });
    guildLocaleCache = new LruMap({ maxSize: config.cache.guildLocaleMaxEntries });

    // Golazo themed rotating statuses (football / general useful)
    statusMessages = [
        { name: 'Golazo ⚽', type: 4, state: 'The beautiful game' },
        { name: 'Scoring goals', type: 4, state: 'with every command' },
        { name: 'Golazo Bot', type: 4, state: 'v1 • discord.js 14 + MongoDB' }
    ];

    commands_handler = new CommandsHandler(this);
    components_handler = new ComponentsHandler(this);
    events_handler = new EventsHandler(this);

    constructor() {
        const intents = [GatewayIntentBits.Guilds];

        if (config.commands.message_commands) {
            intents.push(
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            );
        }

        super({
            intents,
            partials: [
                Partials.Channel,
                Partials.User,
            ],
            presence: {
                activities: [{
                    name: 'Golazo ⚽',
                    type: 4,
                    state: 'Ready to score'
                }]
            },
            // Modern sensible defaults
            failIfNotExists: false,
            allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
        });
        
        new CommandsListener(this);
        new ComponentsListener(this);
    }

    clearStatusRotation = () => {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }

    startCacheSweepers = () => {
        const { sweepExpired: sweepInteractionGuard } = require('../league/discord/interactionGuard');
        const { sweepExpiredRenderCache } = require('../league/render/core/RenderCache');
        const { sweepExpiredAssetCache } = require('../canvas/loadAsset');

        startCacheSweeper('golazo-runtime', [
            this.prefixCache,
            this.userLocaleCache,
            this.guildLocaleCache,
            { sweepExpired: sweepInteractionGuard },
            { sweepExpired: sweepExpiredRenderCache },
            { sweepExpired: sweepExpiredAssetCache },
            getRenderRateLimiter()
        ], config.cache.sweepIntervalMs);
    }

    stopCacheSweepers = () => {
        stopAllCacheSweepers();
    }

    /**
     * Drop in-memory guild settings when the bot leaves a guild.
     * @param {string} guildId
     */
    purgeGuildCaches = (guildId) => {
        if (!guildId) return;

        this.prefixCache.delete(guildId);
        this.guildLocaleCache.delete(guildId);
    }

    startStatusRotation = () => {
        this.clearStatusRotation();

        let index = 0;
        this.statusInterval = setInterval(() => {
            this.user.setPresence({ activities: [this.statusMessages[index]] });
            index = (index + 1) % this.statusMessages.length;
        }, 4000);
    }

    connect = async () => {
        warn(`Attempting to connect to the Discord bot... (${this.login_attempts + 1})`);

        this.login_timestamp = Date.now();

        try {
            // Connect MongoDB first (idempotent after first success). Uses MONGODB_URI from .env.
            await connectMongo();

            await this.login(process.env.CLIENT_TOKEN);

            // Warm prefix cache for known guilds (best-effort; falls back to config default)
            await this.warmPrefixCache();
            await this.warmLocaleCache();

            if (this.handlersLoaded) {
                this.commands_handler.reload();
                this.components_handler.reload();
                this.events_handler.reload();
            } else {
                this.commands_handler.load();
                this.components_handler.load();
                this.events_handler.load();
                this.handlersLoaded = true;
            }

            this.startStatusRotation();
            this.startCacheSweepers();

            warn('Attempting to register application commands... (this might take a while!)');
            await this.commands_handler.registerApplicationCommands(config.development);
            this.login_attempts = 0;
            success('Successfully registered application commands. For specific guild? ' + (config.development.enabled ? 'Yes' : 'No'));
        } catch (err) {
            error('Failed to connect to the Discord bot, retrying...');
            error(err);
            this.login_attempts++;
            setTimeout(this.connect, 5000);
        }
    }

    /**
     * Warm the in-memory prefix cache from MongoDB on startup.
     * Non-fatal if it fails for some guilds.
     */
    warmPrefixCache = async () => {
        try {
            const GuildSettings = mongoose.model('GuildSettings');
            const docs = await GuildSettings.find({}).lean().exec();
            for (const doc of docs) {
                if (doc.prefix && doc.prefix !== config.commands.prefix) {
                    this.prefixCache.set(doc.guildId, doc.prefix);
                }
            }
            info(`Prefix cache warmed with ${this.prefixCache.size} custom guild prefixes.`);
        } catch (e) {
            warn('Could not warm prefix cache (will fetch on demand):', e.message || e);
        }
    }

    /**
     * Get effective prefix for a guild (cache → Mongo → config default).
     * @param {string} guildId
     * @returns {Promise<string>}
     */
    getPrefix = async (guildId) => {
        if (!guildId) return config.commands.prefix;

        if (this.prefixCache.has(guildId)) {
            return this.prefixCache.get(guildId);
        }

        try {
            const GuildSettings = mongoose.model('GuildSettings');
            const doc = await GuildSettings.findOne({ guildId }).lean().exec();
            const prefix = doc?.prefix || config.commands.prefix;
            if (prefix !== config.commands.prefix) {
                this.prefixCache.set(guildId, prefix);
            }
            return prefix;
        } catch (e) {
            return config.commands.prefix;
        }
    }

    /**
     * Set (or reset to default) per-guild prefix. Updates Mongo + cache.
     * @param {string} guildId
     * @param {string} prefix
     */
    setPrefix = async (guildId, prefix) => {
        const GuildSettings = mongoose.model('GuildSettings');
        const defaultPrefix = config.commands.prefix;

        if (!prefix || prefix === defaultPrefix) {
            await GuildSettings.deleteOne({ guildId }).exec();
            this.prefixCache.delete(guildId);
        } else {
            await GuildSettings.findOneAndUpdate(
                { guildId },
                { $set: { prefix } },
                { upsert: true, new: true }
            ).exec();
            this.prefixCache.set(guildId, prefix);
        }
    }

    warmLocaleCache = async () => {
        try {
            const GuildSettings = mongoose.model('GuildSettings');
            const UserSettings = mongoose.model('UserSettings');
            const [guildDocs, userDocs] = await Promise.all([
                GuildSettings.find({ defaultLocale: { $ne: null } }).lean().exec(),
                UserSettings.find({ locale: { $ne: null } }).lean().exec()
            ]);

            for (const doc of guildDocs) {
                if (doc.defaultLocale) {
                    this.guildLocaleCache.set(doc.guildId, normalizeLocale(doc.defaultLocale));
                }
            }

            for (const doc of userDocs) {
                if (doc.locale) {
                    this.userLocaleCache.set(doc.userId, normalizeLocale(doc.locale));
                }
            }

            info(`Locale cache warmed — users: ${this.userLocaleCache.size}, guilds: ${this.guildLocaleCache.size}.`);
        } catch (e) {
            warn('Could not warm locale cache:', e.message || e);
        }
    }

    /**
     * @param {string} userId
     */
    getUserLocale = async (userId) => {
        if (!userId) return null;

        if (this.userLocaleCache.has(userId)) {
            return this.userLocaleCache.get(userId);
        }

        try {
            const UserSettings = mongoose.model('UserSettings');
            const doc = await UserSettings.findOne({ userId }).lean().exec();
            const locale = doc?.locale ? normalizeLocale(doc.locale) : null;

            if (locale) {
                this.userLocaleCache.set(userId, locale);
            }

            return locale;
        } catch {
            return null;
        }
    }

    /**
     * @param {string} userId
     * @param {string | null} locale
     */
    setUserLocale = async (userId, locale) => {
        const UserSettings = mongoose.model('UserSettings');

        if (!locale) {
            await UserSettings.deleteOne({ userId }).exec();
            this.userLocaleCache.delete(userId);
            return;
        }

        const normalized = normalizeLocale(locale);

        await UserSettings.findOneAndUpdate(
            { userId },
            { $set: { locale: normalized } },
            { upsert: true, new: true }
        ).exec();

        this.userLocaleCache.set(userId, normalized);
    }

    /**
     * @param {string} guildId
     */
    getGuildDefaultLocale = async (guildId) => {
        if (!guildId) return null;

        if (this.guildLocaleCache.has(guildId)) {
            return this.guildLocaleCache.get(guildId);
        }

        try {
            const GuildSettings = mongoose.model('GuildSettings');
            const doc = await GuildSettings.findOne({ guildId }).lean().exec();
            const locale = doc?.defaultLocale ? normalizeLocale(doc.defaultLocale) : null;

            if (locale) {
                this.guildLocaleCache.set(guildId, locale);
            }

            return locale;
        } catch {
            return null;
        }
    }

    /**
     * @param {string} guildId
     * @param {string | null} locale
     */
    setGuildDefaultLocale = async (guildId, locale) => {
        const GuildSettings = mongoose.model('GuildSettings');

        if (!locale) {
            await GuildSettings.updateOne({ guildId }, { $unset: { defaultLocale: '' } }).exec();
            this.guildLocaleCache.delete(guildId);
            return;
        }

        const normalized = normalizeLocale(locale);

        await GuildSettings.findOneAndUpdate(
            { guildId },
            { $set: { defaultLocale: normalized } },
            { upsert: true, new: true }
        ).exec();

        this.guildLocaleCache.set(guildId, normalized);
    }

    /**
     * @param {{ userId?: string, guildId?: string | null, discordLocale?: string | null }} input
     * @returns {Promise<{ locale: string, source: 'user' | 'guild' | 'discord' | 'default' }>}
     */
    resolveLocale = async (input) => {
        const fallback = config.i18n?.defaultLocale || 'en';

        if (input.userId) {
            const userLocale = await this.getUserLocale(input.userId);

            if (userLocale) {
                return { locale: userLocale, source: 'user' };
            }
        }

        if (input.guildId) {
            const guildLocale = await this.getGuildDefaultLocale(input.guildId);

            if (guildLocale) {
                return { locale: guildLocale, source: 'guild' };
            }
        }

        if (input.discordLocale) {
            const discord = normalizeLocale(input.discordLocale);

            if (discord) {
                return { locale: discord, source: 'discord' };
            }
        }

        return { locale: normalizeLocale(fallback), source: 'default' };
    }
}

module.exports = DiscordBot;
