const { ChatInputCommandInteraction, ApplicationCommandOptionType } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const { LEAGUE_FORMAT } = require('../../league/constants/leagueFormat');
const { routeLeagueCommand } = require('../../league/discord/router');
const { createTranslator } = require('../../i18n');
const { sendCompact } = require('../../ui/ReplyService');

const leagueSlugOption = {
    name: 'league',
    description: 'League slug (e.g. super-lig).',
    type: ApplicationCommandOptionType.String,
    required: true,
    min_length: 1,
    max_length: 50,
    autocomplete: true,
};

const teamNameOption = {
    name: 'name',
    description: 'Team name.',
    type: ApplicationCommandOptionType.String,
    required: true,
    min_length: 2,
    max_length: 32
};

const matchStatusOptions = [
    leagueSlugOption,
    {
        name: 'home',
        description: 'Home team name.',
        type: ApplicationCommandOptionType.String,
        required: true,
        min_length: 2,
        max_length: 32,
    },
    {
        name: 'away',
        description: 'Away team name.',
        type: ApplicationCommandOptionType.String,
        required: true,
        min_length: 2,
        max_length: 32,
    },
    {
        name: 'round',
        description: 'Round number (optional if unique match).',
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
    },
];

module.exports = new ApplicationCommand({
    command: {
        name: 'league',
        description: 'Golazo football league management.',
        type: 1,
        options: [
            {
                name: 'create',
                description: 'Create a new league in this server.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Display name for the league.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        min_length: 2,
                        max_length: 64
                    },
                    {
                        name: 'slug',
                        description: 'Custom slug (optional). Auto-generated from name if omitted.',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        min_length: 1,
                        max_length: 50
                    },
                    {
                        name: 'format',
                        description: 'League format.',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        choices: [
                            { name: 'Single Round Robin', value: LEAGUE_FORMAT.SINGLE_ROUND_ROBIN },
                            { name: 'Double Round Robin', value: LEAGUE_FORMAT.DOUBLE_ROUND_ROBIN }
                        ]
                    }
                ]
            },
            {
                name: 'list',
                description: 'List all leagues in this server.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'fixture',
                description: 'Generate and view league fixtures.',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'generate',
                        description: 'Generate the round-robin fixture for a league.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [leagueSlugOption]
                    },
                    {
                        name: 'show',
                        description: 'Show fixtures for the current week (use buttons to browse weeks).',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [leagueSlugOption]
                    },
                    {
                        name: 'regenerate',
                        description: 'Rebuild fixture (only if no match results entered).',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [leagueSlugOption]
                    }
                ]
            },
            {
                name: 'team',
                description: 'Manage teams in a league.',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'add',
                        description: 'Add a team to a league.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            leagueSlugOption,
                            teamNameOption,
                            {
                                name: 'short_name',
                                description: 'Short tag for standings (max 4 chars).',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                                max_length: 4
                            },
                            {
                                name: 'captain',
                                description: 'Team captain (Discord user).',
                                type: ApplicationCommandOptionType.User,
                                required: false
                            },
                            {
                                name: 'role',
                                description: 'Linked Discord role (optional).',
                                type: ApplicationCommandOptionType.Role,
                                required: false
                            },
                            {
                                name: 'primary_color',
                                description: 'Primary hex color (e.g. #1a472a).',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                                max_length: 7
                            },
                            {
                                name: 'logo_url',
                                description: 'Team logo URL (optional).',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                                max_length: 512
                            }
                        ]
                    },
                    {
                        name: 'remove',
                        description: 'Remove a team from a league.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [leagueSlugOption, teamNameOption]
                    },
                    {
                        name: 'edit',
                        description: 'Edit an existing team.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            leagueSlugOption,
                            teamNameOption,
                            {
                                name: 'new_name',
                                description: 'New team name.',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                                min_length: 2,
                                max_length: 32
                            },
                            {
                                name: 'short_name',
                                description: 'New short tag.',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                                max_length: 4
                            },
                            {
                                name: 'captain',
                                description: 'New team captain.',
                                type: ApplicationCommandOptionType.User,
                                required: false
                            },
                            {
                                name: 'role',
                                description: 'New linked Discord role.',
                                type: ApplicationCommandOptionType.Role,
                                required: false
                            },
                            {
                                name: 'primary_color',
                                description: 'New primary hex color.',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                                max_length: 7
                            },
                            {
                                name: 'logo_url',
                                description: 'New logo URL.',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                                max_length: 512
                            }
                        ]
                    },
                    {
                        name: 'list',
                        description: 'List teams in a league.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            leagueSlugOption,
                            {
                                name: 'page',
                                description: 'Page number for large team lists.',
                                type: ApplicationCommandOptionType.Integer,
                                required: false,
                                min_value: 1
                            }
                        ]
                    }
                ]
            },
            {
                name: 'score',
                description: 'Enter match results from the fixture view.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    leagueSlugOption,
                    {
                        name: 'round',
                        description: 'Starting round (defaults to current).',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: 1
                    },
                ]
            },
            {
                name: 'score-correct',
                description: 'Correct an existing match result (league admin only).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    leagueSlugOption,
                    {
                        name: 'home',
                        description: 'Home team name.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        min_length: 2,
                        max_length: 32
                    },
                    {
                        name: 'away',
                        description: 'Away team name.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        min_length: 2,
                        max_length: 32
                    },
                    {
                        name: 'home_goals',
                        description: 'Corrected home goals.',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 0,
                        max_value: 99
                    },
                    {
                        name: 'away_goals',
                        description: 'Corrected away goals.',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 0,
                        max_value: 99
                    },
                    {
                        name: 'round',
                        description: 'Round number (optional if unique match).',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: 1
                    },
                    {
                        name: 'reason',
                        description: 'Optional correction note.',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        max_length: 200
                    },
                ]
            },
            {
                name: 'forfeit',
                description: 'Record a walkover/forfeit result (league admin only).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    leagueSlugOption,
                    {
                        name: 'home',
                        description: 'Home team name.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        min_length: 2,
                        max_length: 32
                    },
                    {
                        name: 'away',
                        description: 'Away team name.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        min_length: 2,
                        max_length: 32
                    },
                    {
                        name: 'winner',
                        description: 'Winning team (forfeiting opponent loses).',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        min_length: 2,
                        max_length: 32
                    },
                    {
                        name: 'round',
                        description: 'Round number (optional if unique match).',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: 1
                    },
                ]
            },
            {
                name: 'match',
                description: 'Postpone, cancel, or resume matches.',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'postpone',
                        description: 'Postpone a scheduled match.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: matchStatusOptions,
                    },
                    {
                        name: 'cancel',
                        description: 'Cancel a match.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: matchStatusOptions,
                    },
                    {
                        name: 'resume',
                        description: 'Resume a postponed match.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: matchStatusOptions,
                    },
                ],
            },
            {
                name: 'standings',
                description: 'Show the league standings table.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    leagueSlugOption,
                    {
                        name: 'page',
                        description: 'Page number for large standings tables.',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: 1
                    },
                ]
            },
            {
                name: 'settings',
                description: 'View and manage league settings.',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'show',
                        description: 'Show current league settings.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [leagueSlugOption]
                    },
                    {
                        name: 'points',
                        description: 'Update win/draw/loss point values (before any results).',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            leagueSlugOption,
                            {
                                name: 'win',
                                description: 'Points for a win.',
                                type: ApplicationCommandOptionType.Integer,
                                required: false,
                                min_value: 0,
                                max_value: 20
                            },
                            {
                                name: 'draw',
                                description: 'Points for a draw.',
                                type: ApplicationCommandOptionType.Integer,
                                required: false,
                                min_value: 0,
                                max_value: 20
                            },
                            {
                                name: 'loss',
                                description: 'Points for a loss.',
                                type: ApplicationCommandOptionType.Integer,
                                required: false,
                                min_value: 0,
                                max_value: 20
                            }
                        ]
                    },
                    {
                        name: 'permission',
                        description: 'Add or remove league admins or score reporters.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            leagueSlugOption,
                            {
                                name: 'user',
                                description: 'Discord user to update.',
                                type: ApplicationCommandOptionType.User,
                                required: true
                            },
                            {
                                name: 'role',
                                description: 'Permission role to assign.',
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: [
                                    { name: 'Admin', value: 'admin' },
                                    { name: 'Score reporter', value: 'scorer' }
                                ]
                            },
                            {
                                name: 'action',
                                description: 'Add or remove the permission.',
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: [
                                    { name: 'Add', value: 'add' },
                                    { name: 'Remove', value: 'remove' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'channel',
                        description: 'Set the announcements channel for this league.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            leagueSlugOption,
                            {
                                name: 'announcements',
                                description: 'Text channel for league announcements (omit to clear).',
                                type: ApplicationCommandOptionType.Channel,
                                required: false
                            }
                        ]
                    }
                ]
            },
            {
                name: 'audit',
                description: 'View the league audit log.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    leagueSlugOption,
                    {
                        name: 'limit',
                        description: 'Number of recent entries to show (default 10, max 25).',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: 1,
                        max_value: 25
                    }
                ]
            },
            {
                name: 'rollback',
                description: 'Recover league data from inconsistencies.',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'standings',
                        description: 'Rebuild standings from all recorded match results.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [leagueSlugOption]
                    }
                ]
            },
            {
                name: 'reset',
                description: 'Reset a league — clears matches and standings, keeps teams.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [leagueSlugOption]
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
        if (!interaction.guild) {
            const tr = createTranslator(interaction.locale || 'en');

            await sendCompact(interaction, {
                tr,
                description: tr('commands.league.guildOnly'),
                tone: 'warning',
                ephemeral: true
            });
            return;
        }

        await routeLeagueCommand(client, interaction);
    }
}).toJSON();