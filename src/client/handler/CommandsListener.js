const { PermissionsBitField, ChannelType } = require("discord.js");
const DiscordBot = require("../DiscordBot");
const config = require("../../config");
const MessageCommand = require("../../structure/MessageCommand");
const { handleMessageCommandOptions, handleApplicationCommandOptions } = require("./CommandOptions");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { error } = require("../../utils/Console");
const { replyInteractionError } = require("../../utils/interactionError");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");
const { sendCompact } = require("../../ui/ReplyService");

class CommandsListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        client.on('messageCreate', async (message) => {
            if (message.author.bot || message.channel.type === ChannelType.DM) return;

            if (!config.commands.message_commands) return;

            // Use new Mongo-backed (cached) prefix lookup. Falls back to config default.
            const prefix = await client.getPrefix(message.guild.id);

            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/\s+/g);
            const commandInput = args.shift().toLowerCase();

            if (!commandInput.length) return;

            /**
             * @type {MessageCommand['data']}
             */
            const command =
                client.collection.message_commands.get(commandInput) ||
                client.collection.message_commands.get(client.collection.message_commands_aliases.get(commandInput));

            if (!command) return;

            try {
                if (command.options) {
                    const commandContinue = await handleMessageCommandOptions(client, message, command.options, command.command);

                    if (!commandContinue) return;
                }

                if (command.command?.permissions && !message.member.permissions.has(PermissionsBitField.resolve(command.command.permissions))) {
                    const { locale } = await resolveLocaleFromInteraction(message, client);
                    const tr = createTranslator(locale);

                    await sendCompact(message, {
                        tr,
                        description: tr('bot.MISSING_PERMISSIONS'),
                        tone: 'warning',
                        ephemeral: false
                    });

                    return;
                }

                await command.run(client, message, args);
            } catch (err) {
                error(err);
            }
        });

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return;

            if (!config.commands.application_commands.chat_input && interaction.isChatInputCommand()) return;
            if (!config.commands.application_commands.user_context && interaction.isUserContextMenuCommand()) return;
            if (!config.commands.application_commands.message_context && interaction.isMessageContextMenuCommand()) return;

            /**
             * @type {ApplicationCommand['data']}
             */
            const command = client.collection.application_commands.get(interaction.commandName);

            if (!command) return;

            try {
                if (command.options) {
                    const commandContinue = await handleApplicationCommandOptions(client, interaction, command.options, command.command);

                    if (!commandContinue) return;
                }

                await command.run(client, interaction);
            } catch (err) {
                error(err);
                await replyInteractionError(client, interaction, err);
            }
        });
    }
}

module.exports = CommandsListener;