const { ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");
const { send } = require("../../ui/ReplyService");

module.exports = new ApplicationCommand({
    command: {
        name: 'ping',
        description: 'Golazo ping — replies with websocket latency.',
        type: 1,
        options: []
    },
    options: {
        cooldown: 5000
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const { locale } = await resolveLocaleFromInteraction(interaction, client);
        const tr = createTranslator(locale);

        await send(interaction, {
            tr,
            variant: 'utility',
            descriptionKey: 'commands.ping.response',
            descriptionParams: { ms: client.ws.ping }
        });
    }
}).toJSON();