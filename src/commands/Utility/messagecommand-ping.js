const { Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");

module.exports = new MessageCommand({
    command: {
        name: 'ping',
        description: 'Golazo ping — replies with websocket latency.',
        aliases: ['p'],
        permissions: ['SendMessages']
    },
    options: {
        cooldown: 5000
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {Message} message 
     * @param {string[]} args
     */
    run: async (client, message, args) => {
        const { locale } = await resolveLocaleFromInteraction(message, client);
        const tr = createTranslator(locale);

        await message.reply({
            content: tr('commands.ping.response', { ms: client.ws.ping })
        });
    }
}).toJSON();