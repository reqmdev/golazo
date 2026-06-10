const AutocompleteComponent = require('../../structure/AutocompleteComponent');
const LeagueService = require('../../league/services/LeagueService');

module.exports = new AutocompleteComponent({
    commandName: 'dashboard',
    /**
     * @param {import('../../client/DiscordBot')} client
     * @param {import('discord.js').AutocompleteInteraction} interaction
     */
    run: async (client, interaction) => {
        try {
            const focused = interaction.options.getFocused(true);

            if (focused.name !== 'league' || !interaction.guild) {
                await interaction.respond([]);
                return;
            }

            const query = String(focused.value || '').trim().toLowerCase();
            const leagues = await LeagueService.listLeagues(interaction.guild.id);

            const matches = leagues
                .filter((league) => {
                    if (!query) {
                        return true;
                    }

                    return league.slug.includes(query)
                        || league.name.toLowerCase().includes(query);
                })
                .slice(0, 25)
                .map((league) => ({
                    name: `${league.name} (${league.slug})`.slice(0, 100),
                    value: league.slug,
                }));

            await interaction.respond(matches);
        } catch {
            await interaction.respond([]).catch(() => {});
        }
    },
}).toJSON();