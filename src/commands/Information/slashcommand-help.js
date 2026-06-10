const { ChatInputCommandInteraction } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
const { buildHelpPayload } = require('../../help/buildHelp');
const { DEFAULT_HELP_PAGE } = require('../../help/constants');

module.exports = new ApplicationCommand({
    command: {
        name: 'help',
        description: 'Interactive guide to Golazo and the league system.',
        type: 1,
        options: []
    },
    options: {
        cooldown: 10000
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { locale } = await resolveLocaleFromInteraction(interaction, client);
        const tr = createTranslator(locale);

        await interaction.reply(await buildHelpPayload(DEFAULT_HELP_PAGE, tr, locale));
    }
}).toJSON();