const {
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require('@discordjs/builders');
const { AttachmentBuilder, MessageFlags } = require('discord.js');
const { VARIANT_COLORS, LIMITS } = require('./tokens');
const { uiEmoji, titled } = require('./emoji');
const { resolveField, clip } = require('./EmbedFactory');

/** @type {Record<string, keyof typeof VARIANT_COLORS>} */
const VARIANT_ACCENT = {
    full: 'brand',
    canvas: 'league',
    league: 'league',
    utility: 'utility',
    success: 'success',
    info: 'info',
    warning: 'warning',
    danger: 'danger',
    compact: 'neutral',
};

/**
 * @param {string} text
 * @param {number} [max]
 */
function clipV2Text(text, max = LIMITS.description) {
    if (!text || text.length <= max) {
        return text || '';
    }

    return `${text.slice(0, max - 1)}…`;
}

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 * @param {string} titleKey
 * @param {Record<string, string | number>} [titleParams]
 */
function formatV2Title(tr, titleKey, titleParams) {
    const raw = tr(titleKey, titleParams);
    const plain = raw.replace(/\*\*/g, '').trim();

    return clipV2Text(`### ${plain}`);
}

/**
 * @param {import('discord.js').InteractionReplyOptions} payload
 * @param {boolean} [ephemeral]
 */
function finalizeV2Payload(payload, ephemeral = false) {
    let flags = MessageFlags.IsComponentsV2;

    if (ephemeral) {
        flags |= MessageFlags.Ephemeral;
    }

    return {
        content: '',
        embeds: [],
        attachments: [],
        ...payload,
        flags,
    };
}

/**
 * @param {object} input
 */
function buildInfoCardV2Payload(input) {
    const {
        tr,
        variant = 'full',
        tone,
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
        body,
        image,
        actionRows = [],
        compact = false,
        extraFiles = [],
    } = input;

    const accentKey = tone === 'danger'
        ? 'danger'
        : tone === 'warning'
            ? 'warning'
            : VARIANT_ACCENT[variant] ?? 'brand';

    const container = new ContainerBuilder()
        .setAccentColor(VARIANT_COLORS[accentKey] ?? VARIANT_COLORS.brand);

    const lines = [];
    const resolvedTitle = title ?? (titleKey ? tr(titleKey, titleParams) : null);

    if (resolvedTitle
        && !String(resolvedTitle).startsWith('ui.')
        && !String(resolvedTitle).startsWith('errors.')
        && !compact) {
        const plain = String(titled(tr, String(resolvedTitle), titleEmojiKey))
            .replace(/\*\*/g, '')
            .trim();
        const emoji = titleEmojiKey ? uiEmoji(tr, titleEmojiKey) : '';
        lines.push(`### ${emoji ? `${emoji} ` : ''}**${plain}**`);
    }

    const resolvedDescription = description
        ?? (descriptionKey ? tr(descriptionKey, descriptionParams) : null);
    const descLimit = variant === 'compact' ? LIMITS.compactDescription : LIMITS.description;

    if (resolvedDescription && !String(resolvedDescription).startsWith('errors.')) {
        const text = clip(String(resolvedDescription), descLimit);

        if (compact) {
            const prefix = tone === 'danger'
                ? uiEmoji(tr, 'error')
                : tone === 'warning'
                    ? uiEmoji(tr, 'warning')
                    : uiEmoji(tr, 'info');
            lines.push(`${prefix} ${text}`);
        } else {
            lines.push('', text);
        }
    }

    for (const field of fields) {
        const resolved = resolveField(tr, field);

        if (resolved.name && resolved.name !== '\u200b') {
            lines.push('', `**${resolved.name}**`, resolved.value);
        } else if (resolved.value && resolved.value !== '\u200b') {
            lines.push('', resolved.value);
        }
    }

    if (body) {
        lines.push('', body);
    }

    const mainText = clipV2Text(lines.join('\n').trim());

    if (mainText) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(mainText),
        );
    }

    const files = [...extraFiles.map((file) => {
        if (file instanceof AttachmentBuilder) {
            return file;
        }

        return new AttachmentBuilder(file.buffer, { name: file.filename });
    })];

    if (image?.buffer && image?.filename) {
        files.push(new AttachmentBuilder(image.buffer, { name: image.filename }));
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder()
                    .setURL(`attachment://${image.filename}`)
                    .setDescription(clipV2Text(
                        resolvedTitle ? String(resolvedTitle).replace(/\*\*/g, '') : 'Golazo',
                        256,
                    )),
            ),
        );
    }

    const resolvedFooter = footer ?? (footerKey ? tr(footerKey, footerParams) : null);

    if (resolvedFooter && !resolvedFooter.startsWith('ui.')) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(clipV2Text(`-# ${resolvedFooter}`)),
        );
    }

    for (const row of actionRows) {
        container.addActionRowComponents(row);
    }

    return finalizeV2Payload({
        files,
        components: [container],
    });
}

/**
 * @param {object} input
 * @param {(key: string, params?: Record<string, string | number>) => string} input.tr
 * @param {string} input.headingKey
 * @param {Record<string, string | number>} [input.headingParams]
 * @param {string} [input.subtitle]
 * @param {string} [input.subtitleKey]
 * @param {Record<string, string | number>} [input.subtitleParams]
 * @param {string} [input.meta]
 * @param {string} [input.metaKey]
 * @param {Record<string, string | number>} [input.metaParams]
 * @param {string} [input.postImageHint]
 * @param {string} [input.postImageHintKey]
 * @param {Record<string, string | number>} [input.postImageHintParams]
 * @param {{ buffer: Buffer, filename: string }} [input.image]
 * @param {string} [input.body]
 * @param {string} [input.footer]
 * @param {string} [input.footerKey]
 * @param {Record<string, string | number>} [input.footerParams]
 * @param {keyof typeof VARIANT_COLORS} [input.accentVariant]
 * @param {import('discord.js').ActionRowBuilder[]} [input.actionRows]
 */
function buildLeagueCardV2Payload(input) {
    const {
        tr,
        headingKey,
        headingParams,
        subtitle,
        subtitleKey,
        subtitleParams,
        meta,
        metaKey,
        metaParams,
        postImageHint,
        postImageHintKey,
        postImageHintParams,
        image,
        body,
        footer,
        footerKey,
        footerParams,
        accentVariant = 'brand',
        actionRows = [],
    } = input;

    const hasImage = Boolean(image?.buffer && image?.filename);
    const titleText = formatV2Title(tr, headingKey, headingParams);
    const metaText = meta ?? (metaKey ? tr(metaKey, metaParams) : '');

    const container = new ContainerBuilder()
        .setAccentColor(VARIANT_COLORS[accentVariant] ?? VARIANT_COLORS.brand);

    const files = [];

    if (hasImage) {
        if (metaText) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(clipV2Text(metaText)),
            );
        }

        files.push(new AttachmentBuilder(image.buffer, { name: image.filename }));
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder()
                    .setURL(`attachment://${image.filename}`)
                    .setDescription(clipV2Text(titleText.replace(/^### /, ''), 256)),
            ),
        );

        const hintText = postImageHint
            ?? (postImageHintKey ? tr(postImageHintKey, postImageHintParams) : '');

        if (hintText) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(clipV2Text(`-# ${hintText}`)),
            );
        }
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(titleText),
        );

        const subtitleText = subtitle
            ?? (subtitleKey ? tr(subtitleKey, subtitleParams) : '');

        if (subtitleText) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(clipV2Text(`-# ${subtitleText}`)),
            );
        }

        if (body) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(clipV2Text(body)),
            );
        }

        const footerText = footer ?? (footerKey ? tr(footerKey, footerParams) : '');

        if (footerText) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(clipV2Text(`-# ${footerText}`)),
            );
        }
    }

    for (const row of actionRows) {
        container.addActionRowComponents(row);
    }

    return finalizeV2Payload({
        files,
        components: [container],
    });
}

/**
 * @param {import('discord.js').InteractionReplyOptions} payload
 */
function isComponentsV2Payload(payload) {
    const flags = payload?.flags;

    if (flags == null) {
        return false;
    }

    if (Array.isArray(flags)) {
        return flags.includes(MessageFlags.IsComponentsV2);
    }

    return (flags & MessageFlags.IsComponentsV2) === MessageFlags.IsComponentsV2;
}

module.exports = {
    buildLeagueCardV2Payload,
    buildInfoCardV2Payload,
    formatV2Title,
    clipV2Text,
    finalizeV2Payload,
    isComponentsV2Payload,
};