const { replyWithError } = require('../utils/discord');
const { isDuplicateInteraction, markInteractionHandled } = require('./interactionGuard');
const { withOperationLock } = require('./operationLock');
const LeagueError = require('../errors/LeagueError');
const { createTranslator } = require('../../i18n');

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('../../client/DiscordBot')} client
 * @param {{ defer?: boolean, ephemeral?: boolean, lockKey?: string | null }} options
 * @param {(interaction: import('discord.js').ChatInputCommandInteraction, ctx: { locale: string, tr: Function, client: import('../../client/DiscordBot') }) => Promise<void>} handler
 */
async function runLeagueInteraction(interaction, client, options, handler) {
    if (isDuplicateInteraction(interaction.id)) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: options.ephemeral ?? false }).catch(() => {});
        }

        return;
    }

    const { defer = false, ephemeral = false, lockKey = null } = options;

    try {
        if (defer && !interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral });
        }

        const { locale } = await client.resolveLocale({
            userId: interaction.user.id,
            guildId: interaction.guild?.id,
            discordLocale: interaction.locale
        });

        const tr = createTranslator(locale);
        const ctx = { locale, tr, client };

        const execute = () => handler(interaction, ctx);

        if (lockKey) {
            await withOperationLock(lockKey, execute);
        } else {
            await execute();
        }

        markInteractionHandled(interaction.id);
    } catch (err) {
        const locale = interaction.locale || 'en';
        const tr = createTranslator(locale);

        if (err instanceof LeagueError && err.code === 'OPERATION_LOCKED') {
            await replyWithError(interaction, err, tr, locale);
            return;
        }

        await replyWithError(interaction, err, tr, locale);
    }
}

module.exports = { runLeagueInteraction };