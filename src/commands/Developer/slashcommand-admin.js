const { ChatInputCommandInteraction, ApplicationCommandOptionType } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
const { deliver } = require('../../ui/ReplyService');
const LeagueError = require('../../league/errors/LeagueError');
const AdminService = require('../../league/services/AdminService');
const { replyWithError } = require('../../league/utils/discord');
const { DEFAULT_TEAM_LIMITS } = require('../../league/constants/defaults');

module.exports = new ApplicationCommand({
    command: {
        name: 'admin',
        description: 'Golazo admin tools (developers only).',
        type: 1,
        dm_permission: false,
        default_member_permissions: '0',
        options: [
            {
                name: 'seed',
                description: 'Create a fake league with demo teams (max 20).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'teams',
                        description: 'Number of teams (2–20, default 20).',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: DEFAULT_TEAM_LIMITS.minTeams,
                        max_value: DEFAULT_TEAM_LIMITS.maxTeams,
                    },
                    {
                        name: 'fixture',
                        description: 'Generate fixture after seeding (default true).',
                        type: ApplicationCommandOptionType.Boolean,
                        required: false,
                    },
                ],
            },
            {
                name: 'wipe',
                description: 'Delete all leagues, teams, matches, and standings in this server.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'confirm',
                        description: 'Must be true to confirm deletion.',
                        type: ApplicationCommandOptionType.Boolean,
                        required: true,
                    },
                ],
            },
        ],
    },
    options: {
        botDevelopers: true,
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { locale } = await resolveLocaleFromInteraction(interaction, client);
        const tr = createTranslator(locale);

        if (!interaction.guild) {
            await deliver(interaction, {
                content: tr('commands.league.guildOnly'),
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'seed') {
                const teamCount = interaction.options.getInteger('teams') ?? undefined;
                const generateFixture = interaction.options.getBoolean('fixture') ?? true;

                const result = await AdminService.seedFakeLeague(
                    interaction.guild.id,
                    interaction.user.id,
                    { teamCount, generateFixture },
                );

                const fixtureLine = result.fixtureGenerated
                    ? tr('commands.admin.seed.fixtureLine', {
                        matchCount: result.matchCount,
                        totalRounds: result.totalRounds,
                    })
                    : tr('commands.admin.seed.noFixtureLine');

                await deliver(interaction, {
                    content: tr('commands.admin.seed.success', {
                        slug: result.slug,
                        teamCount: result.teamCount,
                        fixtureLine,
                    }),
                });
                return;
            }

            if (subcommand === 'wipe') {
                const confirm = interaction.options.getBoolean('confirm', true);
                const result = await AdminService.wipeGuildLeagueData(interaction.guild.id, { confirm });

                await deliver(interaction, {
                    content: tr('commands.admin.wipe.success', result),
                });
            }
        } catch (err) {
            await replyWithError(interaction, err, tr, locale);
        }
    },
}).toJSON();