const { Message } = require("discord.js");
const MessageCommand = require("../../structure/MessageCommand");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const DiscordBot = require("../DiscordBot");
const config = require("../../config");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");
const { sendCompact } = require("../../ui/ReplyService");

const application_commands_cooldown = new Map();
const message_commands_cooldown = new Map();

/**
 * @param {DiscordBot} client
 * @param {import("discord.js").Interaction} interaction
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @param {'warning' | 'danger' | 'compact'} [tone]
 */
async function replyBotCompactInteraction(client, interaction, key, params, tone = 'compact') {
    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);

    await sendCompact(interaction, {
        tr,
        description: tr(`bot.${key}`, params),
        tone,
        ephemeral: true
    });
}

/**
 * @param {DiscordBot} client
 * @param {Message} message
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @param {'warning' | 'danger' | 'compact'} [tone]
 */
async function replyBotCompactMessage(client, message, key, params, tone = 'compact') {
    const { locale } = await resolveLocaleFromInteraction(message, client);
    const tr = createTranslator(locale);

    await sendCompact(message, {
        tr,
        description: tr(`bot.${key}`, params),
        tone,
        ephemeral: false
    });
}

/**
 * 
 * @param {DiscordBot} client
 * @param {import("discord.js").Interaction} interaction 
 * @param {ApplicationCommand['data']['options']} options 
 * @param {ApplicationCommand['data']['command']} command 
 * @returns {Promise<boolean>}
 */
const handleApplicationCommandOptions = async (client, interaction, options, command) => {
    if (options.botOwner) {
        if (interaction.user.id !== config.users.ownerId) {
            await replyBotCompactInteraction(client, interaction, 'NOT_BOT_OWNER');
            return false;
        }
    }

    if (options.botDevelopers) {
        const developers = config.users?.developers ?? [];

        if (!developers.includes(interaction.user.id)) {
            await replyBotCompactInteraction(client, interaction, 'NOT_BOT_DEVELOPER');
            return false;
        }
    }

    if (options.guildOwner) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            await replyBotCompactInteraction(client, interaction, 'NOT_GUILD_OWNER');
            return false;
        }
    }

    if (options.cooldown) {
        const cooldownFunction = () => {
            let data = application_commands_cooldown.get(interaction.user.id);

            data.push(interaction.commandName);

            application_commands_cooldown.set(interaction.user.id, data);

            setTimeout(() => {
                let data = application_commands_cooldown.get(interaction.user.id);

                data = data.filter((v) => v !== interaction.commandName);

                if (data.length <= 0) {
                    application_commands_cooldown.delete(interaction.user.id);
                } else {
                    application_commands_cooldown.set(interaction.user.id, data);
                }
            }, options.cooldown);
        };

        if (application_commands_cooldown.has(interaction.user.id)) {
            let data = application_commands_cooldown.get(interaction.user.id);

            if (data.some((cmd) => cmd === interaction.commandName)) {
                await replyBotCompactInteraction(
                    client,
                    interaction,
                    'GUILD_COOLDOWN',
                    { cooldown: options.cooldown / 1000 },
                    'warning'
                );

                return false;
            }

            cooldownFunction();
        } else {
            application_commands_cooldown.set(interaction.user.id, [interaction.commandName]);
            cooldownFunction();
        }
    }

    return true;
};

/**
 * 
 * @param {DiscordBot} client
 * @param {Message} message 
 * @param {MessageCommand['data']['options']} options 
 * @param {MessageCommand['data']['command']} command 
 * @returns {Promise<boolean>}
 */
const handleMessageCommandOptions = async (client, message, options, command) => {
    if (options.botOwner) {
        if (message.author.id !== config.users.ownerId) {
            await replyBotCompactMessage(client, message, 'NOT_BOT_OWNER');
            return false;
        }
    }

    if (options.botDevelopers) {
        const developers = config.users?.developers ?? [];

        if (!developers.includes(message.author.id)) {
            await replyBotCompactMessage(client, message, 'NOT_BOT_DEVELOPER');
            return false;
        }
    }

    if (options.guildOwner) {
        if (message.author.id !== message.guild.ownerId) {
            await replyBotCompactMessage(client, message, 'NOT_GUILD_OWNER');
            return false;
        }
    }

    if (options.nsfw) {
        if (!message.channel.nsfw) {
            await replyBotCompactMessage(client, message, 'CHANNEL_NOT_NSFW');
            return false;
        }
    }

    if (options.cooldown) {
        const cooldownFunction = () => {
            let data = message_commands_cooldown.get(message.author.id);

            data.push(command.name);

            message_commands_cooldown.set(message.author.id, data);

            setTimeout(() => {
                let data = message_commands_cooldown.get(message.author.id);

                data = data.filter((cmd) => cmd !== command.name);

                if (data.length <= 0) {
                    message_commands_cooldown.delete(message.author.id);
                } else {
                    message_commands_cooldown.set(message.author.id, data);
                }
            }, options.cooldown);
        };

        if (message_commands_cooldown.has(message.author.id)) {
            let data = message_commands_cooldown.get(message.author.id);

            if (data.some((v) => v === command.name)) {
                await replyBotCompactMessage(
                    client,
                    message,
                    'GUILD_COOLDOWN',
                    { cooldown: options.cooldown / 1000 },
                    'warning'
                );

                return false;
            }

            cooldownFunction();
        } else {
            message_commands_cooldown.set(message.author.id, [command.name]);
            cooldownFunction();
        }
    }

    return true;
};

module.exports = { handleApplicationCommandOptions, handleMessageCommandOptions };