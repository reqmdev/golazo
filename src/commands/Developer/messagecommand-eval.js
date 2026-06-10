const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");

module.exports = new MessageCommand({
    command: {
        name: 'eval',
        description: 'Execute JavaScript (owner only, Golazo debug).',
        aliases: ['ev', 'calistir']
    },
    options: {
        botOwner: true
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
                content: tr('commands.eval.missingCode')
            });

            return;
        }

        message = await message.reply({
            content: tr('common.pleaseWait')
        });

        const code = args.slice(0).join(' ');

        try {
            let result = eval(`(async () => { ${code} })()`);

            if (result instanceof Promise) result = await result;

            if (typeof result !== 'string') result = require('util').inspect(result);

            result = `${result}`.replace(new RegExp(client.token, 'gi'), 'CLIENT_TOKEN');

            await message.edit({
                content: tr('commands.eval.ok'),
                files: [
                    new AttachmentBuilder(Buffer.from(`${result}`, 'utf-8'), { name: 'output.ts' })
                ]
            });
        } catch (err) {
            await message.edit({
                content: tr('common.somethingWentWrong'),
                files: [
                    new AttachmentBuilder(Buffer.from(`${err}`, 'utf-8'), { name: 'output.ts' })
                ]
            });
        };
    }
}).toJSON();