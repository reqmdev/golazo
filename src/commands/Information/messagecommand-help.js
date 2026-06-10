const { Message } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const MessageCommand = require('../../structure/MessageCommand');
const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
const { buildHelpPayload } = require('../../help/buildHelp');
const { DEFAULT_HELP_PAGE } = require('../../help/constants');

module.exports = new MessageCommand({
    command: {
        name: 'help',
        description: 'Interactive guide to Golazo and the league system.',
        aliases: ['h', 'yardim', 'yardım', 'y']
    },
    options: {
        cooldown: 10000
    },
    /**
     * @param {DiscordBot} client
     * @param {Message} message
     * @param {string[]} args
     */
    run: async (client, message, args) => {
        const { locale } = await resolveLocaleFromInteraction(message, client);
        const tr = createTranslator(locale);

        await message.reply(await buildHelpPayload(DEFAULT_HELP_PAGE, tr, locale));
    }
}).toJSON();