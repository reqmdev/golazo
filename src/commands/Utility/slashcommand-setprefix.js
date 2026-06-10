const { ChatInputCommandInteraction, ApplicationCommandOptionType, PermissionFlagsBits } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const config = require("../../config");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");
const { send, sendCompact } = require("../../ui/ReplyService");

module.exports = new ApplicationCommand({
    command: {
        name: 'setprefix',
        description: 'Set the Golazo prefix for this guild.',
        type: 1,
        default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
        options: [{
            name: 'prefix',
            description: 'The new prefix (max 5 characters). Omit to reset to default.',
            type: ApplicationCommandOptionType.String,
            required: false,
            max_length: 5
        }]
    },
    options: {
        cooldown: 5000
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { locale } = await resolveLocaleFromInteraction(interaction, client);
        const tr = createTranslator(locale);
        const prefix = interaction.options.getString('prefix');
        const defaultPrefix = config.commands.prefix;

        if (prefix && prefix.length > 5) {
            await sendCompact(interaction, {
                tr,
                description: tr('commands.setprefix.tooLong', { length: prefix.length }),
                tone: 'danger',
                ephemeral: true
            });
            return;
        }

        await client.setPrefix(interaction.guild.id, prefix || defaultPrefix);

        if (!prefix || prefix === defaultPrefix) {
            await send(interaction, {
                tr,
                variant: 'utility',
                descriptionKey: 'commands.setprefix.reset',
                descriptionParams: { prefix: defaultPrefix }
            });
            return;
        }

        await send(interaction, {
            tr,
            variant: 'utility',
            descriptionKey: 'commands.setprefix.updated',
            descriptionParams: { prefix }
        });
    }
}).toJSON();