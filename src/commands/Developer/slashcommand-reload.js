const { ChatInputCommandInteraction, AttachmentBuilder } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const config = require('../../config');
const { clearModuleCache } = require('../../utils/clearModuleCache');
const { clearRenderCache, getRenderCacheStats } = require('../../league/render/core/RenderCache');
const { clearImageCache, getImageCacheStats } = require('../../league/render/core/ImageCache');
const { resetFonts } = require('../../league/render/core/FontLoader');
const { clearInteractionGuard } = require('../../league/discord/interactionGuard');
const { clearOperationLocks } = require('../../league/discord/operationLock');
const { isDistributedLockEnabled } = require('../../league/discord/distributedLock');
const { describeLeagueSlash } = require('../../utils/describeLeagueSlash');
const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
const { deliver } = require('../../ui/ReplyService');
const { buildInfoCardV2Payload, finalizeV2Payload } = require('../../ui/ComponentsV2Factory');
const { clearCatalogCache } = require('../../i18n/registry');
const { clearSlashLocalizationCache } = require('../../i18n/discordLocalizations');

module.exports = new ApplicationCommand({
    command: {
        name: 'reload',
        description: 'Reload all Golazo commands (developers only).',
        type: 1,
        dm_permission: false,
        default_member_permissions: '0',
        options: []
    },
    options: {
        botDevelopers: true
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const { locale } = await resolveLocaleFromInteraction(interaction, client);
        const tr = createTranslator(locale);

        await interaction.deferReply();

        try {
            clearRenderCache();
            clearImageCache();
            resetFonts();
            clearInteractionGuard();
            clearOperationLocks();
            clearCatalogCache();
            clearSlashLocalizationCache();

            clearModuleCache('/src/league/');

            client.commands_handler.reload();
            client.components_handler.reload();
            client.events_handler.reload();

            await client.commands_handler.registerApplicationCommands(config.development);

            const slashCount = client.rest_application_commands_array.length;
            const leagueCommand = client.collection.application_commands.get('league');
            const leagueInfo = describeLeagueSlash(leagueCommand);
            const renderStats = getRenderCacheStats();
            const imageStats = getImageCacheStats();
            const scope = config.development.enabled
                ? tr('commands.reload.scopeGuild', { guildId: config.development.guildId })
                : tr('commands.reload.scopeGlobal');

            await deliver(interaction, finalizeV2Payload(buildInfoCardV2Payload({
                tr,
                variant: 'utility',
                titleKey: 'commands.reload.complete',
                description: [
                    tr('commands.reload.slashSynced', { scope, count: slashCount }),
                    tr('commands.reload.leagueOptions', {
                        count: leagueInfo.topLevelCount,
                        groups: leagueInfo.groups.join(', ')
                    }),
                    tr('commands.reload.fixturePage', {
                        status: leagueInfo.hasFixturePage
                            ? tr('commands.reload.fixturePageRegistered')
                            : tr('commands.reload.fixturePageMissing')
                    }),
                    tr('commands.reload.distributedLock', {
                        mode: isDistributedLockEnabled()
                            ? tr('commands.reload.lockMongo')
                            : tr('commands.reload.lockInProcess')
                    }),
                    tr('commands.reload.cachesCleared'),
                    tr('commands.reload.cacheState', {
                        renderSize: renderStats.size,
                        imageSize: imageStats.size
                    })
                ].join('\n'),
            })));
        } catch (err) {
            await deliver(interaction, finalizeV2Payload(buildInfoCardV2Payload({
                tr,
                tone: 'danger',
                description: tr('commands.reload.error'),
                extraFiles: [
                    new AttachmentBuilder(Buffer.from(`${err}`, 'utf-8'), { name: 'output.ts' })
                ],
            })));
        };
    }
}).toJSON();