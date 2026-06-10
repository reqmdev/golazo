const LeagueError = require('../errors/LeagueError');
const { createTranslator } = require('../../i18n');
const { sendCompact } = require('../../ui/ReplyService');
const { error: logError } = require('../../utils/Console');

/**
 * Sends a user-facing reply for LeagueError or a generic failure.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {unknown} err
 * @param {(key: string, params?: object) => string} [tr]
 * @param {string} [locale]
 */
async function replyWithError(interaction, err, tr = null, locale = 'en') {
    const translator = tr ?? createTranslator(locale);
    let description;

    if (err instanceof LeagueError) {
        description = translator(`errors.${err.code}`, err.params);
    } else {
        logError('[league]', err?.stack || err?.message || err);
        description = translator('errors.GENERIC_LEAGUE_ERROR');
    }

    const alreadyAcked = Boolean(interaction.deferred || interaction.replied);

    await sendCompact(interaction, {
        tr: translator,
        description,
        tone: 'danger',
        ephemeral: !alreadyAcked
    });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').InteractionReplyOptions} payload
 */
async function sendLeagueReply(interaction, payload) {
    const { deliver } = require('../../ui/ReplyService');
    await deliver(interaction, payload);
}

module.exports = {
    replyWithError,
    sendLeagueReply
};