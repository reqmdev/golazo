const {
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    PermissionFlagsBits
} = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const { SUPPORTED_LOCALES, createTranslator } = require('../../i18n');
const { localizeLocaleChoices } = require('../../i18n/discordLocalizations');
const { send, sendCompact } = require('../../ui/ReplyService');

const localeChoices = localizeLocaleChoices(SUPPORTED_LOCALES.map((code) => ({
    name: code === 'en' ? 'English' : 'Türkçe',
    value: code
})));

module.exports = new ApplicationCommand({
    command: {
        name: 'language',
        description: 'Set your preferred language for Golazo bot messages.',
        type: 1,
        options: [
            {
                name: 'set',
                description: 'Set your personal language preference.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'locale',
                        description: 'Language (en or tr).',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: localeChoices
                    }
                ]
            },
            {
                name: 'show',
                description: 'Show your current language and how it was resolved.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'reset',
                description: 'Clear your personal language override.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'server',
                description: 'Manage the server default language.',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'set',
                        description: 'Set the default language for this server.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'locale',
                                description: 'Default language (en or tr).',
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: localeChoices
                            }
                        ]
                    },
                    {
                        name: 'reset',
                        description: 'Clear the server default language.',
                        type: ApplicationCommandOptionType.Subcommand
                    }
                ]
            }
        ]
    },
    options: {
        cooldown: 3000
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const resolved = await client.resolveLocale({
            userId: interaction.user.id,
            guildId: interaction.guild?.id,
            discordLocale: interaction.locale
        });

        const tr = createTranslator(resolved.locale);
        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'server') {
            if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
                await sendCompact(interaction, {
                    tr,
                    description: tr('commands.language.serverPermission'),
                    tone: 'warning',
                    ephemeral: true
                });
                return;
            }

            if (subcommand === 'set') {
                const locale = interaction.options.getString('locale', true);

                if (!SUPPORTED_LOCALES.includes(locale)) {
                    await sendCompact(interaction, {
                        tr,
                        description: tr('commands.language.invalid'),
                        tone: 'danger',
                        ephemeral: true
                    });
                    return;
                }

                await client.setGuildDefaultLocale(interaction.guild.id, locale);
                await send(interaction, {
                    tr,
                    variant: 'utility',
                    descriptionKey: 'commands.language.guildUpdated',
                    descriptionParams: { locale }
                });
                return;
            }

            if (subcommand === 'reset') {
                await client.setGuildDefaultLocale(interaction.guild.id, null);
                await send(interaction, {
                    tr,
                    variant: 'utility',
                    descriptionKey: 'commands.language.guildReset'
                });
            }

            return;
        }

        if (subcommand === 'set') {
            const locale = interaction.options.getString('locale', true);

            if (!SUPPORTED_LOCALES.includes(locale)) {
                await sendCompact(interaction, {
                    tr,
                    description: tr('commands.language.invalid'),
                    tone: 'danger',
                    ephemeral: true
                });
                return;
            }

            await client.setUserLocale(interaction.user.id, locale);
            const userTr = createTranslator(locale);

            await send(interaction, {
                tr: userTr,
                variant: 'utility',
                descriptionKey: 'commands.language.updated',
                descriptionParams: { locale }
            });
            return;
        }

        if (subcommand === 'show') {
            const sourceKey = `commands.language.source.${resolved.source}`;

            await send(interaction, {
                tr,
                variant: 'utility',
                description: [
                    tr('commands.language.showActive', { locale: resolved.locale }),
                    tr(sourceKey)
                ].join('\n'),
                ephemeral: true
            });
            return;
        }

        if (subcommand === 'reset') {
            await client.setUserLocale(interaction.user.id, null);
            await send(interaction, {
                tr,
                variant: 'utility',
                descriptionKey: 'commands.language.userReset'
            });
        }
    }
}).toJSON();