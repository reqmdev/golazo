const { Message, PermissionFlagsBits } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");

module.exports = new MessageCommand({
    command: {
        name: 'setprefix',
        description: 'Set prefix for this guild.',
        aliases: ['onek', 'prefix'],
        permissions: [PermissionFlagsBits.ManageGuild]
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

        if (!args[0]) {
            await message.reply({
                content: tr('commands.setprefix.missing')
            });

            return;
        }

        if (args[0].length > 5) {
            await message.reply({
                content: tr('commands.setprefix.tooLong', { length: args[0].length })
            });

            return;
        }

        await client.setPrefix(message.guild.id, args[0]);

        await message.reply({
            content: tr('commands.setprefix.updated', { prefix: args[0] })
        });
    }
}).toJSON();