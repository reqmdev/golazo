const { clipV2Text } = require('../../ui/ComponentsV2Factory');

/**
 * @param {string[]} lines
 */
function joinZone(lines) {
    return clipV2Text(lines.filter(Boolean).join('\n'));
}

/**
 * @param {import('./layout').EmojiBudget} budget
 * @param {(string | { literal?: string, key?: string })[]} emojiCandidates
 * @param {string} label
 * @param {string} value
 */
function buildInfoLine(budget, emojiCandidates, label, value) {
    if (!label) {
        return '';
    }

    const emoji = budget.takeCandidate(emojiCandidates);
    const prefix = emoji ? `${emoji} ` : '';

    return `${prefix}**${label}:** ${value ?? ''}`;
}

/**
 * @param {string[]} lines
 */
function buildInfoBlock(lines) {
    const content = lines.filter(Boolean).join('\n');
    return content ? clipV2Text(content) : '';
}

/**
 * @param {string} text
 * @param {'info' | 'warning' | 'danger'} tone
 * @param {import('./layout').EmojiBudget} budget
 */
function buildControlHint(text, tone, budget) {
    if (!text) {
        return '';
    }

    const emoji = tone === 'danger'
        ? budget.takeCandidate(['⛔', { key: 'error' }])
        : tone === 'warning'
            ? budget.takeCandidate(['⚠️', { key: 'warning' }])
            : budget.takeCandidate(['💡', { key: 'info' }]);

    return clipV2Text(`${emoji ? `${emoji} ` : ''}${text}`);
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {string} emojiKey
 * @param {string} title
 * @param {import('./layout').EmojiBudget} budget
 */
function buildPageTitle(tr, emojiKey, title, budget) {
    const { uiEmoji } = require('../../ui/emoji');
    const emoji = budget.take(emojiKey);
    const heading = emoji ? `${emoji} ${title}` : title;
    return clipV2Text(`### ${heading}`);
}

/**
 * @param {string} text
 */
function buildContextLine(text) {
    return text ? clipV2Text(text) : '';
}

/**
 * @param {string} title
 * @param {import('./layout').EmojiBudget} budget
 * @param {(string | { literal?: string, key?: string })[]} [emojiCandidates]
 */
function buildSectionTitle(title, budget, emojiCandidates = []) {
    if (!title) {
        return '';
    }

    const emoji = budget.takeCandidate(emojiCandidates);
    const prefix = emoji ? `${emoji} ` : '';
    return clipV2Text(`**${prefix}${title}**`);
}

/**
 * @param {boolean} inline
 * @param {string} label
 * @param {string} value
 */
function buildField(inline, label, value) {
    if (!label) {
        return '';
    }

    return inline
        ? clipV2Text(`**${label}** — ${value || ''}`)
        : clipV2Text(`**${label}**\n${value || ''}`);
}

/**
 * @param {string} text
 * @param {string} [emoji]
 */
function buildMutedLine(text, emoji = '') {
    if (!text) {
        return '';
    }

    return clipV2Text(`-# ${emoji ? `${emoji} ` : ''}${text}`);
}

/**
 * @param {string} text
 * @param {'info' | 'warning' | 'danger'} tone
 * @param {import('./layout').EmojiBudget} budget
 */
function buildMetaHint(text, tone, budget) {
    if (!text) {
        return '';
    }

    const emoji = tone === 'danger'
        ? budget.takeCandidate(['⛔', { key: 'error' }])
        : tone === 'warning'
            ? budget.take('warning')
            : budget.takeCandidate(['💡', { key: 'info' }]);

    return buildMutedLine(text, emoji);
}

/**
 * @param {(key: string) => string} tr
 * @param {string} roleKey
 * @param {import('./layout').EmojiBudget} budget
 */
function buildMetaRole(tr, roleKey, budget) {
    if (!roleKey) {
        return '';
    }

    const text = tr(roleKey);

    if (text.startsWith('dashboard.')) {
        return '';
    }

    const emoji = budget.takeLiteral('👤');
    return buildMutedLine(text, emoji);
}

/**
 * @param {string[]} lines
 */
function buildMetaBlock(lines) {
    const content = lines.filter(Boolean).join('\n');
    return content ? clipV2Text(content) : '';
}

/**
 * @param {string} text
 */
function buildMetaTrail(text) {
    if (!text) {
        return '';
    }

    const plain = text.replace(/^\*(.*)\*$/s, '$1').trim();
    return buildMutedLine(plain);
}

/**
 * @param {object} input
 * @param {string} [input.title]
 * @param {string} [input.description]
 * @param {{ label: string, value: string, inline?: boolean }[]} [input.fields]
 */
function buildDocumentBlock(input) {
    const { title, description, fields = [] } = input;
    const lines = [];

    if (title) {
        lines.push(`### ${title}`);
    }

    if (description) {
        lines.push('', description);
    }

    for (const field of fields) {
        const block = buildField(field.inline !== false, field.label, field.value);

        if (block) {
            lines.push('', block);
        }
    }

    return clipV2Text(lines.join('\n').trim());
}

module.exports = {
    joinZone,
    buildPageTitle,
    buildContextLine,
    buildSectionTitle,
    buildInfoLine,
    buildInfoBlock,
    buildControlHint,
    buildField,
    buildMutedLine,
    buildMetaHint,
    buildMetaRole,
    buildMetaBlock,
    buildMetaTrail,
    buildDocumentBlock,
};