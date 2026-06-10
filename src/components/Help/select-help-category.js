const Component = require('../../structure/Component');
const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
const { buildHelpPayload } = require('../../help/buildHelp');
const { HELP_SELECT_ID } = require('../../help/constants');

module.exports = new Component({
    customId: HELP_SELECT_ID,
    type: 'select',
    options: {
        public: true
    },
    /**
     * @param {import('../../client/DiscordBot')} client
     * @param {import('discord.js').StringSelectMenuInteraction} interaction
     */
    run: async (client, interaction) => {
        const pageId = interaction.values[0];
        const { locale } = await resolveLocaleFromInteraction(interaction, client);
        const tr = createTranslator(locale);

        await interaction.update(await buildHelpPayload(pageId, tr, locale));
    }
}).toJSON();