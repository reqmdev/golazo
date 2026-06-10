/**
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 * @param {string} key
 */
function uiEmoji(tr, key) {
    const value = tr(`ui.emoji.${key}`);

    if (!value || value.startsWith('ui.emoji.')) {
        return '';
    }

    return value;
}

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 */
function authorName(tr) {
    const author = tr('ui.author');

    if (!author || author.startsWith('ui.')) {
        return 'Golazo';
    }

    return author;
}

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 * @param {string} title
 * @param {string} [emojiKey]
 */
function titled(tr, title, emojiKey) {
    if (!emojiKey) {
        return title;
    }

    const emoji = uiEmoji(tr, emojiKey);
    return emoji ? `${emoji} ${title}` : title;
}

module.exports = {
    uiEmoji,
    authorName,
    titled
};