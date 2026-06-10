const { AttachmentBuilder, Message } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const MessageCommand = require('../../structure/MessageCommand');
const config = require('../../config');
const { clearModuleCache } = require('../../utils/clearModuleCache');
const { clearRenderCache, getRenderCacheStats } = require('../../league/render/core/RenderCache');
const { clearImageCache, getImageCacheStats } = require('../../league/render/core/ImageCache');
const { resetFonts } = require('../../league/render/core/FontLoader');
const { clearInteractionGuard } = require('../../league/discord/interactionGuard');
const { clearOperationLocks } = require('../../league/discord/operationLock');
const { createTranslator, resolveLocaleFromInteraction } = require('../../i18n');
const { clearCatalogCache } = require('../../i18n/registry');
const { clearSlashLocalizationCache } = require('../../i18n/discordLocalizations');

module.exports = new MessageCommand({
    command: {
        name: 'reload',
        description: 'Reload all Golazo commands (developers only).',
        aliases: ['yenile', 'reload']
    },
    options: {
        botDevelopers: true
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

        message = await message.reply({
            content: tr('commands.reload.pleaseWait')
        });

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
            const renderStats = getRenderCacheStats();
            const imageStats = getImageCacheStats();

            await message.edit({
                content: [
                    tr('commands.reload.complete'),
                    tr('commands.reload.slashSyncedSimple', { count: slashCount }),
                    tr('commands.reload.cacheStateSimple', {
                        renderSize: renderStats.size,
                        imageSize: imageStats.size
                    })
                ].join('\n')
            });
        } catch (err) {
            await message.edit({
                content: tr('commands.reload.error'),
                files: [
                    new AttachmentBuilder(Buffer.from(`${err}`, 'utf-8'), { name: 'output.ts' })
                ]
            });
        };
    }
}).toJSON();