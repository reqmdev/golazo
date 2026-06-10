const config = require('../config');
const {
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
    loadCatalog,
    getNested
} = require('./registry');
const { normalizeLocale } = require('./normalize');

/**
 * @param {string} template
 * @param {Record<string, string | number | null | undefined>} [params]
 */
function interpolate(template, params = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
        const value = params[key];
        return value === undefined || value === null ? '' : String(value);
    });
}

/**
 * @param {string} locale
 * @param {string} key
 * @param {Record<string, string | number | null | undefined>} [params]
 */
function t(locale, key, params = {}) {
    const normalized = normalizeLocale(locale);
    const primary = getNested(loadCatalog(normalized), key);

    if (typeof primary === 'string') {
        return interpolate(primary, params);
    }

    if (normalized !== DEFAULT_LOCALE) {
        const fallback = getNested(loadCatalog(DEFAULT_LOCALE), key);

        if (typeof fallback === 'string') {
            return interpolate(fallback, params);
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] missing key: ${key} (${normalized})`);
    }

    return key;
}

/**
 * @param {string} locale
 */
function createTranslator(locale) {
    const resolved = normalizeLocale(locale);

    return (key, params) => t(resolved, key, params);
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction | import('discord.js').Message} interactionOrMessage
 * @param {import('../client/DiscordBot')} client
 */
async function resolveLocaleFromInteraction(interactionOrMessage, client) {
    const user = interactionOrMessage.user || interactionOrMessage.author;
    const guildId = interactionOrMessage.guild?.id || interactionOrMessage.guildId || null;
    const discordLocale = interactionOrMessage.locale || interactionOrMessage.guildLocale || null;

    return client.resolveLocale({
        userId: user?.id,
        guildId,
        discordLocale
    });
}

/**
 * @param {string} code
 * @param {string} locale
 * @param {Record<string, unknown>} [params]
 */
function translateError(code, locale, params = {}) {
    return t(locale, `errors.${code}`, params);
}

module.exports = {
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
    normalizeLocale,
    t,
    createTranslator,
    resolveLocaleFromInteraction,
    translateError,
    interpolate
};