const DiscordBot = require("../DiscordBot");
const { error } = require("../../utils/Console");
const { replyInteractionError } = require("../../utils/interactionError");
const { checkRenderRateLimit } = require("../../utils/interactionRateLimit");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");
const { sendCompact } = require("../../ui/ReplyService");

/** @type {Record<string, string>} */
const RENDER_PREFIX_NAMESPACES = {
    'ldb:': 'dashboard',
    'lfx:': 'fixture',
    'lsc:': 'score',
    'lst:': 'standings',
    'ltm:': 'team_list',
    'lcl:': 'champions',
    'lcs:': 'champions_score',
};

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {import('../DiscordBot')} client
 * @param {string} customId
 */
async function enforceRenderRateLimit(interaction, client, customId) {
    const prefix = Object.keys(RENDER_PREFIX_NAMESPACES).find((entry) => customId.startsWith(entry));

    if (!prefix) {
        return true;
    }

    const namespace = RENDER_PREFIX_NAMESPACES[prefix];
    const verdict = checkRenderRateLimit(interaction, namespace);

    if (verdict.allowed) {
        return true;
    }

    const { locale } = await resolveLocaleFromInteraction(interaction, client);
    const tr = createTranslator(locale);
    const retryAfterSec = Math.max(1, Math.ceil((verdict.retryAfterMs || 1000) / 1000));

    await sendCompact(interaction, {
        tr,
        description: tr('bot.RENDER_RATE_LIMIT', { cooldown: retryAfterSec }),
        tone: 'warning',
        ephemeral: true
    });

    return false;
}

class ComponentsListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        client.on('interactionCreate', async (interaction) => {
            const checkUserPermissions = async (component) => {
                if (component.options?.public === false && interaction.user.id !== interaction.message?.interaction?.user?.id) {
                    const { locale } = await resolveLocaleFromInteraction(interaction, client);
                    const tr = createTranslator(locale);

                    await sendCompact(interaction, {
                        tr,
                        description: tr('bot.COMPONENT_NOT_PUBLIC'),
                        tone: 'warning',
                        ephemeral: true
                    });

                    return false;
                }

                return true;
            }

            try {
                if (interaction.isButton()) {
                    if (interaction.customId.startsWith('ldb:')
                        || interaction.customId.startsWith('lfx:')
                        || interaction.customId.startsWith('lsc:')
                        || interaction.customId.startsWith('lst:')
                        || interaction.customId.startsWith('ltm:')
                        || interaction.customId.startsWith('lcl:')
                        || interaction.customId.startsWith('lcs:')) {
                        if (!(await enforceRenderRateLimit(interaction, client, interaction.customId))) {
                            return;
                        }
                    }

                    if (interaction.customId.startsWith('ldb:')) {
                        const { handleDashboardInteraction } = require('../../dashboard/handlers/router');
                        await handleDashboardInteraction(interaction, client);
                        return;
                    }

                    if (interaction.customId.startsWith('lfx:')) {
                        const { handleFixtureNavButton } = require('../../league/discord/fixtureNav');
                        await handleFixtureNavButton(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lsc:')) {
                        const { handleScoreNavButton } = require('../../league/discord/scoreNav');
                        await handleScoreNavButton(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lst:')) {
                        const { handleStandingsNavButton } = require('../../league/discord/standingsNav');
                        await handleStandingsNavButton(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('ltm:')) {
                        const { handleTeamListNavButton } = require('../../league/discord/teamListNav');
                        await handleTeamListNavButton(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lcl:')) {
                        const { handleChampionsNavButton } = require('../../league/discord/championsNav');
                        await handleChampionsNavButton(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lcs:')) {
                        const { handleChampionsScoreNavButton } = require('../../league/discord/championsScoreNav');
                        await handleChampionsScoreNavButton(client, interaction);
                        return;
                    }

                    const component = client.collection.components.buttons.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        await component.run(client, interaction);
                    } catch (err) {
                        error(err);
                        await replyInteractionError(client, interaction, err);
                    }

                    return;
                }

                if (interaction.isAnySelectMenu()) {
                    if (interaction.customId.startsWith('ldb:') || interaction.customId.startsWith('lsc:') || interaction.customId.startsWith('lcs:')) {
                        if (!(await enforceRenderRateLimit(interaction, client, interaction.customId))) {
                            return;
                        }
                    }

                    if (interaction.customId.startsWith('ldb:')) {
                        const { handleDashboardInteraction } = require('../../dashboard/handlers/router');
                        await handleDashboardInteraction(interaction, client);
                        return;
                    }

                    if (interaction.customId.startsWith('lcs:ops:')) {
                        const { handleChampionsOpsMatchSelect } = require('../../league/discord/championsScoreNav');
                        await handleChampionsOpsMatchSelect(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lcs:sel:')) {
                        const { handleChampionsScoreMatchSelect } = require('../../league/discord/championsScoreNav');
                        await handleChampionsScoreMatchSelect(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lsc:')) {
                        const { handleScoreMatchSelect } = require('../../league/discord/scoreNav');
                        await handleScoreMatchSelect(client, interaction);
                        return;
                    }

                    const component = client.collection.components.selects.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        await component.run(client, interaction);
                    } catch (err) {
                        error(err);
                        await replyInteractionError(client, interaction, err);
                    }

                    return;
                }

                if (interaction.isModalSubmit()) {
                    if (interaction.customId.startsWith('ldb:') || interaction.customId.startsWith('lsc:') || interaction.customId.startsWith('lcs:') || interaction.customId.startsWith('lfx:')) {
                        if (!(await enforceRenderRateLimit(interaction, client, interaction.customId))) {
                            return;
                        }
                    }

                    if (interaction.customId.startsWith('ldb:')) {
                        const { handleDashboardInteraction } = require('../../dashboard/handlers/router');
                        await handleDashboardInteraction(interaction, client);
                        return;
                    }

                    if (interaction.customId.startsWith('lfx:')) {
                        const { handleFixtureNavModalSubmit } = require('../../league/discord/fixtureNav');
                        await handleFixtureNavModalSubmit(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lsc:')) {
                        const { handleScoreModalSubmit } = require('../../league/discord/scoreNav');
                        await handleScoreModalSubmit(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lcs:mdl:')) {
                        const { handleChampionsScoreModalSubmit } = require('../../league/discord/championsScoreNav');
                        await handleChampionsScoreModalSubmit(client, interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('lcs:pen:')) {
                        const { handleChampionsPenModalSubmit } = require('../../league/discord/championsScoreNav');
                        await handleChampionsPenModalSubmit(client, interaction);
                        return;
                    }

                    const component = client.collection.components.modals.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        await component.run(client, interaction);
                    } catch (err) {
                        error(err);
                        await replyInteractionError(client, interaction, err);
                    }

                    return;
                }

                if (interaction.isAutocomplete()) {
                    const component = client.collection.components.autocomplete.get(interaction.commandName);

                    if (!component) return;

                    try {
                        await component.run(client, interaction);
                    } catch (err) {
                        error(err);

                        try {
                            await interaction.respond([]);
                        } catch {
                            // autocomplete token may have expired
                        }
                    }

                    return;
                }
            } catch (err) {
                error(err);
                await replyInteractionError(client, interaction, err);
            }
        });
    }
}

module.exports = ComponentsListener;