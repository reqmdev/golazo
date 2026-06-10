const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { VARIANT_COLORS, LIMITS, MARK_FILENAME } = require('./tokens');
const { authorName, titled } = require('./emoji');

/**
 * @param {string} text
 * @param {number} max
 */
function clip(text, max) {
    if (!text || text.length <= max) {
        return text || '';
    }

    return `${text.slice(0, max - 1)}…`;
}

/**
 * @typedef {object} UiField
 * @property {string} [name]
 * @property {string} [nameKey]
 * @property {string} [value]
 * @property {string} [valueKey]
 * @property {Record<string, string | number>} [nameParams]
 * @property {Record<string, string | number>} [valueParams]
 * @property {boolean} [inline]
 */

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 * @param {UiField} field
 */
function resolveField(tr, field) {
    const name = field.name ?? (field.nameKey ? tr(field.nameKey, field.nameParams) : '\u200b');
    const value = field.value ?? (field.valueKey ? tr(field.valueKey, field.valueParams) : '\u200b');

    return {
        name: clip(name, LIMITS.fieldName),
        value: clip(value, LIMITS.fieldValue),
        inline: field.inline === true
    };
}

/**
 * @param {object} options
 * @param {(key: string, params?: Record<string, string | number>) => string} options.tr
 * @param {string} [options.variant]
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
 * @param {{ buffer: Buffer, filename: string }} [options.thumbnail]
 * @param {boolean} [options.useMarkIcon]
 */
function buildEmbed(options) {
    const {
        tr,
        variant = 'full',
        title,
        titleKey,
        titleParams,
        titleEmojiKey,
        description,
        descriptionKey,
        descriptionParams,
        fields = [],
        footer,
        footerKey,
        footerParams,
        image,
        thumbnail,
        useMarkIcon = false
    } = options;

    const color = VARIANT_COLORS[variant] ?? VARIANT_COLORS.full;
    const embed = new EmbedBuilder().setColor(color);

    const author = authorName(tr);
    embed.setAuthor({
        name: clip(author, LIMITS.author),
        iconURL: useMarkIcon ? `attachment://${MARK_FILENAME}` : undefined
    });

    const resolvedTitle = title ?? (titleKey ? tr(titleKey, titleParams) : null);

    if (resolvedTitle && !String(resolvedTitle).startsWith('ui.') && !String(resolvedTitle).startsWith('errors.')) {
        embed.setTitle(clip(titled(tr, String(resolvedTitle), titleEmojiKey), LIMITS.title));
    }

    const resolvedDescription = description ?? (descriptionKey ? tr(descriptionKey, descriptionParams) : null);
    const descLimit = variant === 'compact' ? LIMITS.compactDescription : LIMITS.description;

    if (resolvedDescription && !String(resolvedDescription).startsWith('errors.')) {
        embed.setDescription(clip(String(resolvedDescription), descLimit));
    }

    for (const field of fields) {
        embed.addFields(resolveField(tr, field));
    }

    const resolvedFooter = footer ?? (footerKey ? tr(footerKey, footerParams) : null);

    if (resolvedFooter && !resolvedFooter.startsWith('ui.')) {
        embed.setFooter({ text: clip(resolvedFooter, LIMITS.footer) });
    }

    if (image?.filename && image.buffer) {
        embed.setImage(`attachment://${image.filename}`);
    }

    if (thumbnail?.filename && thumbnail.buffer) {
        embed.setThumbnail(`attachment://${thumbnail.filename}`);
    }

    return embed;
}

/**
 * @param {object} options
 * @param {(key: string, params?: Record<string, string | number>) => string} options.tr
 * @param {string} options.description
 * @param {'warning' | 'danger' | 'compact'} [options.tone]
 */
function buildCompact(options) {
    const { tr, description, tone = 'compact' } = options;

    return buildEmbed({
        tr,
        variant: tone,
        description
    });
}

/**
 * @param {ReturnType<typeof buildEmbed>} embed
 * @param {Array<{ buffer: Buffer, filename: string } | AttachmentBuilder>} [attachments]
 * @param {import('discord.js').ActionRowBuilder[]} [components]
 * @param {boolean} [ephemeral]
 */
function toPayload(embed, attachments = [], components = [], ephemeral = false) {
    const files = attachments.map((item) => {
        if (item instanceof AttachmentBuilder) {
            return item;
        }

        return new AttachmentBuilder(item.buffer, { name: item.filename });
    });

    const payload = {
        embeds: [embed],
        files,
        components
    };

    if (ephemeral) {
        payload.ephemeral = true;
    }

    return payload;
}

module.exports = {
    buildEmbed,
    buildCompact,
    toPayload,
    clip,
    resolveField
};