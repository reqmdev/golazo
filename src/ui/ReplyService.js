const { AttachmentBuilder } = require('discord.js');
const { buildInfoCardV2Payload, finalizeV2Payload, isComponentsV2Payload } = require('./ComponentsV2Factory');

/**
 * @param {import('discord.js').AttachmentBuilder | { attachment?: unknown, name?: string, buffer?: Buffer, filename?: string }} file
 */
function attachmentName(file) {
    if (file instanceof AttachmentBuilder) {
        return file.name;
    }

    return file.name ?? file.filename ?? null;
}

/**
 * Discord requires clearing prior embeds/attachments when replacing a visual reply.
 *
 * @param {import('discord.js').InteractionReplyOptions} payload
 */
function normalizeDeliverPayload(payload) {
    const next = { ...payload };

    if (next.files?.length || isComponentsV2Payload(next)) {
        next.attachments = [];
        next.embeds = [];
        next.content = next.content ?? '';
    }

    return next;
}

/**
 * @param {import('discord.js').Interaction | import('discord.js').Message} target
 * @param {import('discord.js').InteractionReplyOptions} payload
 */
async function deliver(target, payload) {
    const normalized = normalizeDeliverPayload(payload);

    if ('deferred' in target || 'replied' in target) {
        const interaction = target;

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(normalized);
            return;
        }

        if (interaction.isMessageComponent?.()) {
            await interaction.update(normalized);
            return;
        }

        await interaction.reply(normalized);
        return;
    }

    await target.reply(normalized);
}

/**
 * @typedef {import('./EmbedFactory').UiField} UiField
 */

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {object} options
 * @param {(key: string, params?: Record<string, string | number>) => string} options.tr
 * @param {'full' | 'canvas' | 'utility' | 'success' | 'info' | 'league'} [options.variant]
 * @param {string} [options.title]
 * @param {string} [options.titleKey]
 * @param {Record<string, string | number>} [options.titleParams]
 * @param {string} [options.titleEmojiKey]
 * @param {string} [options.description]
 * @param {string} [options.descriptionKey]
 * @param {Record<string, string | number>} [options.descriptionParams]
 * @param {UiField[]} [options.fields]
 * @param {string} [options.footer]
 * @param {string} [options.footerKey]
 * @param {Record<string, string | number>} [options.footerParams]
 * @param {{ buffer: Buffer, filename: string }} [options.image]
 * @param {string} [options.body]
 * @param {import('discord.js').ActionRowBuilder[]} [options.components]
 * @param {boolean} [options.ephemeral]
 * @param {Array<{ buffer: Buffer, filename: string } | AttachmentBuilder>} [options.files]
 */
async function send(interaction, options) {
    const {
        components = [],
        ephemeral = false,
        files: extraFiles = [],
        image,
        ...cardOptions
    } = options;

    const payload = buildInfoCardV2Payload({
        ...cardOptions,
        image,
        actionRows: components,
        extraFiles,
    });

    await deliver(interaction, finalizeV2Payload(payload, ephemeral));
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {object} options
 * @param {(key: string, params?: Record<string, string | number>) => string} options.tr
 * @param {string} options.description
 * @param {'warning' | 'danger' | 'compact'} [options.tone]
 * @param {boolean} [options.ephemeral]
 */
async function sendCompact(interaction, options) {
    const { tr, description, tone = 'compact', ephemeral = true } = options;

    const payload = buildInfoCardV2Payload({
        tr,
        variant: 'compact',
        tone,
        description,
        compact: true,
    });

    await deliver(interaction, finalizeV2Payload(payload, ephemeral));
}

/**
 * @param {import('discord.js').Message} message
 * @param {Parameters<typeof send>[1]} options
 */
async function sendMessage(message, options) {
    await send(message, options);
}

module.exports = {
    send,
    sendCompact,
    sendMessage,
    deliver,
    normalizeDeliverPayload,
    isComponentsV2Payload,
};