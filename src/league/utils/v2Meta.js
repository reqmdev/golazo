const { uiEmoji } = require('../../ui/emoji');

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {string} emojiKey
 * @param {string} labelKey
 * @param {string} value
 */
function metaLine(tr, emojiKey, labelKey, value, options = {}) {
    const { plain = false } = options;
    const label = tr(labelKey);

    if (plain) {
        return `**${label}** — ${value}`;
    }

    const emoji = uiEmoji(tr, emojiKey) || '•';
    return `${emoji} **${label}** — ${value}`;
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {object} input
 * @param {string} input.viewEmojiKey
 * @param {string} input.viewTitleKey
 * @param {string} input.name
 * @param {string} input.slug
 * @param {number} [input.round]
 * @param {number} [input.totalRounds]
 * @param {number} [input.page]
 * @param {number} [input.totalPages]
 * @param {string[]} [input.extraLines]
 */
function resolveMetaEmoji(tr, emojiKey) {
    return uiEmoji(tr, emojiKey) || '';
}

/**
 * @param {Set<string>} usedEmojis
 */
function appendMetaLine(tr, lines, usedEmojis, emojiKey, labelKey, value) {
    const emoji = resolveMetaEmoji(tr, emojiKey);
    const plain = !emoji || usedEmojis.has(emoji);

    lines.push(metaLine(tr, emojiKey, labelKey, value, { plain }));

    if (emoji && !plain) {
        usedEmojis.add(emoji);
    }
}

function buildV2MetaBlock(tr, input) {
    const {
        viewEmojiKey,
        viewTitleKey,
        name,
        slug,
        round,
        totalRounds,
        page,
        totalPages,
        extraLines = [],
    } = input;

    const viewEmoji = resolveMetaEmoji(tr, viewEmojiKey);
    const viewTitle = tr(viewTitleKey);
    const usedEmojis = new Set(viewEmoji ? [viewEmoji] : []);
    const lines = [
        `### ${viewEmoji ? `${viewEmoji} ` : ''}**${viewTitle}**`,
        '',
    ];

    appendMetaLine(tr, lines, usedEmojis, 'league', 'common.v2LabelLeague', `**${name}**`);
    appendMetaLine(tr, lines, usedEmojis, 'code', 'common.v2LabelCode', `**${slug}**`);

    if (round != null && totalRounds != null) {
        appendMetaLine(
            tr,
            lines,
            usedEmojis,
            'fixture',
            'common.v2LabelRound',
            `**${round}** / ${totalRounds}`,
        );
    }

    if (page && totalPages && totalPages > 1) {
        appendMetaLine(
            tr,
            lines,
            usedEmojis,
            'page',
            'common.v2LabelPage',
            `**${page}** / ${totalPages}`,
        );
    }

    for (const line of extraLines) {
        if (line) {
            lines.push(line);
        }
    }

    return lines.join('\n');
}

module.exports = { buildV2MetaBlock, metaLine };