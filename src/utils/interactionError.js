const { createTranslator, resolveLocaleFromInteraction } = require('../i18n');
const { sendCompact } = require('../ui/ReplyService');
const { reportError } = require('./errorReporter');

/**
 * Best-effort user-facing error for unhandled interaction failures.
 *
 * @param {import('../client/DiscordBot')} client
 * @param {import('discord.js').Interaction} interaction
 * @param {unknown} err
 */
async function replyInteractionError(client, interaction, err) {
    reportError(err, 'interaction');

    if (!interaction.isRepliable?.() || interaction.replied) {
        return;
    }

    try {
        const { locale } = await resolveLocaleFromInteraction(interaction, client);
        const tr = createTranslator(locale);

        await sendCompact(interaction, {
            tr,
            description: tr('common.somethingWentWrong'),
            tone: 'danger',
            ephemeral: true,
        });
    } catch {
        try {
            if (interaction.deferred) {
                await interaction.editReply({ content: 'Something went wrong.', embeds: [], components: [] });
            } else if (!interaction.replied) {
                await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
            }
        } catch {
            // interaction token expired or already handled
        }
    }
}

module.exports = { replyInteractionError };