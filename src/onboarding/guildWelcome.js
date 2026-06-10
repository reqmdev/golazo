const { PermissionFlagsBits } = require('discord.js');
const { createTranslator } = require('../i18n');
const { buildInfoCardV2Payload } = require('../ui/ComponentsV2Factory');
const { normalizeDeliverPayload } = require('../ui/ReplyService');

/**
 * @param {import('discord.js').Guild} guild
 */
function pickWelcomeChannel(guild) {
    const systemChannel = guild.systemChannel;

    if (systemChannel?.isTextBased?.()) {
        const perms = systemChannel.permissionsFor(guild.members.me);

        if (perms?.has(PermissionFlagsBits.SendMessages)) {
            return systemChannel;
        }
    }

    const channels = [...guild.channels.cache.values()]
        .filter((channel) => channel.isTextBased?.() && !channel.isThread?.())
        .sort((a, b) => a.rawPosition - b.rawPosition);

    for (const channel of channels) {
        const perms = channel.permissionsFor(guild.members.me);

        if (perms?.has(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages)) {
            return channel;
        }
    }

    return null;
}

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 */
function buildGuildWelcomePayload(tr) {
    return buildInfoCardV2Payload({
        tr,
        variant: 'league',
        titleKey: 'bot.welcome.title',
        descriptionKey: 'bot.welcome.description',
        fields: [
            { nameKey: 'bot.welcome.flowName', valueKey: 'bot.welcome.flowValue' },
            { nameKey: 'bot.welcome.helpName', valueKey: 'bot.welcome.helpValue' },
        ],
        footerKey: 'bot.welcome.footer',
    });
}

/**
 * @param {import('discord.js').Guild} guild
 */
async function sendGuildWelcome(guild) {
    const locale = guild.preferredLocale?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
    const tr = createTranslator(locale);
    const channel = pickWelcomeChannel(guild);

    if (!channel) {
        return;
    }

    try {
        await channel.send(normalizeDeliverPayload(buildGuildWelcomePayload(tr)));
    } catch (err) {
        console.warn(`[guildWelcome] send failed for ${guild.id}:`, err?.message || err);
    }
}

module.exports = {
    sendGuildWelcome,
    buildGuildWelcomePayload,
    pickWelcomeChannel,
};