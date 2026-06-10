const { ChatInputCommandInteraction, ApplicationCommandOptionType } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const { openDashboard } = require('../../dashboard/handlers/router');

module.exports = new ApplicationCommand({
    command: {
        name: 'dashboard',
        description: 'Open the interactive Golazo league management dashboard.',
        type: 1,
        options: [{
            name: 'league',
            description: 'Jump directly to a league panel (slug).',
            type: ApplicationCommandOptionType.String,
            required: false,
            min_length: 1,
            max_length: 50,
            autocomplete: true,
        }],
    },
    options: {
        cooldown: 5000,
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const slug = interaction.options.getString('league') || undefined;
        await openDashboard(interaction, client, slug);
    },
}).toJSON();