const { TextDisplayBuilder } = require('discord.js');
const { clipV2Text } = require('../../ui/ComponentsV2Factory');
const { uiEmoji } = require('../../ui/emoji');

/**
 * Tracks emoji glyphs already used inside one Components V2 container.
 */
class EmojiBudget {
    /**
     * @param {(key: string) => string} tr
     */
    constructor(tr) {
        this.tr = tr;
        this.used = new Set();
    }

    /**
     * @param {string} glyph
     */
    has(glyph) {
        return Boolean(glyph) && this.used.has(glyph);
    }

    /**
     * @param {string} emojiKey
     */
    take(emojiKey) {
        const glyph = uiEmoji(this.tr, emojiKey);

        if (!glyph || this.used.has(glyph)) {
            return '';
        }

        this.used.add(glyph);
        return glyph;
    }

    /**
     * @param {string} glyph
     */
    takeLiteral(glyph) {
        if (!glyph || this.used.has(glyph)) {
            return '';
        }

        this.used.add(glyph);
        return glyph;
    }

    /**
     * @param {string[]} emojiKeys
     */
    takeFirst(emojiKeys = []) {
        for (const key of emojiKeys) {
            const glyph = this.take(key);

            if (glyph) {
                return glyph;
            }
        }

        return '';
    }

    /**
     * @param {(string | { literal?: string, key?: string })[]} candidates
     */
    takeCandidate(candidates = []) {
        for (const candidate of candidates) {
            if (typeof candidate === 'string') {
                if (candidate.length <= 4) {
                    const glyph = this.takeLiteral(candidate);

                    if (glyph) {
                        return glyph;
                    }
                } else {
                    const glyph = this.take(candidate);

                    if (glyph) {
                        return glyph;
                    }
                }
            } else if (candidate?.literal) {
                const glyph = this.takeLiteral(candidate.literal);

                if (glyph) {
                    return glyph;
                }
            } else if (candidate?.key) {
                const glyph = this.take(candidate.key);

                if (glyph) {
                    return glyph;
                }
            }
        }

        return '';
    }
}

/**
 * @param {(key: string) => string} tr
 */
function createEmojiBudget(tr) {
    return new EmojiBudget(tr);
}

/**
 * @param {{ text: string, emoji?: string }[]} segments
 */
function formatBreadcrumbLine(segments) {
    const parts = segments
        .filter((segment) => segment.text)
        .map((segment) => {
            const prefix = segment.emoji ? `${segment.emoji} ` : '';
            return `${prefix}${segment.text}`;
        });

    return parts.length ? clipV2Text(`*${parts.join(' › ')}*`) : '';
}

/**
 * @param {string} text
 */
function buildSubtitle(text) {
    return text ? clipV2Text(text) : '';
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {string} emojiKey
 * @param {string} title
 * @param {EmojiBudget} budget
 */
function buildDashboardHeader(tr, emojiKey, title, budget) {
    const emoji = budget.take(emojiKey);
    const heading = emoji ? `${emoji} ${title}` : title;
    return clipV2Text(`### ${heading}`);
}

/**
 * @param {{ label: string, value: string, emojiKeys?: string[], emojiLiteral?: string }} stat
 * @param {EmojiBudget} budget
 */
function buildStatLine(stat, budget) {
    const emoji = stat.emojiLiteral
        ? budget.takeLiteral(stat.emojiLiteral)
        : budget.takeFirst(stat.emojiKeys || []);

    return `${emoji ? `${emoji} ` : ''}**${stat.value}** ${stat.label}`;
}

/**
 * @param {{ label: string, value: string, emojiKeys?: string[], emojiLiteral?: string }[]} stats
 * @param {EmojiBudget} budget
 */
function buildStatLines(stats, budget) {
    if (!stats?.length) {
        return [];
    }

    return stats.map((stat) => buildStatLine(stat, budget)).filter(Boolean);
}

/**
 * @param {{ label: string, value: string, emojiKeys?: string[], emojiLiteral?: string }[]} stats
 * @param {EmojiBudget} budget
 */
function buildStatBlock(stats, budget) {
    const lines = buildStatLines(stats, budget);
    return lines.length ? clipV2Text(lines.join('\n')) : '';
}

/**
 * @param {{ label: string, value: string, emojiKeys?: string[], emojiLiteral?: string }[]} stats
 * @param {EmojiBudget} budget
 */
function buildStatStripInline(stats, budget) {
    const lines = buildStatLines(stats, budget);
    return lines.length ? clipV2Text(lines.join('  ·  ')) : '';
}

/**
 * @param {{ label: string, value: string, emojiKeys?: string[], emojiLiteral?: string }[]} stats
 * @param {EmojiBudget} budget
 */
function buildStatSections(stats, budget) {
    const lines = buildStatLines(stats, budget);

    if (!lines.length) {
        return [];
    }

    /** @type {{ lines: string[] }[]} */
    const sections = [];

    for (let index = 0; index < lines.length; index += 3) {
        sections.push({
            lines: lines.slice(index, index + 3),
        });
    }

    return sections;
}

/**
 * @param {string} text
 * @param {'info' | 'warning' | 'danger'} tone
 * @param {EmojiBudget} budget
 */
function buildCallout(text, tone, budget) {
    if (!text) {
        return '';
    }

    const emoji = tone === 'danger'
        ? budget.takeCandidate(['⛔', { key: 'error' }])
        : tone === 'warning'
            ? budget.take('warning')
            : budget.takeCandidate(['💡', { key: 'info' }]);

    return clipV2Text(`> ${emoji ? `${emoji} ` : ''}${text}`);
}

/**
 * @param {string} title
 * @param {string} [emoji]
 */
function buildSectionHeading(title, emoji = '') {
    if (!title) {
        return '';
    }

    const prefix = emoji ? `${emoji} ` : '';
    return clipV2Text(`**${prefix}${title}**`);
}

/**
 * @param {[string, string][]} rows
 */
function buildKeyValueList(rows) {
    if (!rows?.length) {
        return '';
    }

    return clipV2Text(
        rows
            .filter(([label]) => label)
            .map(([label, value]) => `**${label}**\n${value || ''}`)
            .join('\n\n'),
    );
}

/**
 * @param {string} title
 * @param {string} content
 * @param {EmojiBudget} budget
 * @param {(string | { literal?: string, key?: string })[]} emojiCandidates
 */
function buildLabeledBlock(title, content, budget, emojiCandidates = []) {
    if (!content) {
        return '';
    }

    const emoji = budget.takeCandidate(emojiCandidates);
    const heading = emoji ? `${emoji} **${title}**` : `**${title}**`;

    return clipV2Text(`${heading}\n${content}`);
}

/**
 * @param {(key: string) => string} tr
 * @param {string} roleKey
 * @param {EmojiBudget} budget
 */
function buildRoleFooter(tr, roleKey, budget) {
    if (!roleKey) {
        return '';
    }

    const text = tr(roleKey);

    if (text.startsWith('dashboard.')) {
        return '';
    }

    const emoji = budget.takeLiteral('👤');
    return clipV2Text(`${emoji ? `${emoji} ` : ''}*${text}*`);
}

/**
 * @param {string} content
 * @param {EmojiBudget} budget
 */
function sanitizeLeagueTextContent(content, budget) {
    if (!content) {
        return '';
    }

    let lines = content.split('\n');

    if (lines[0]?.startsWith('###')) {
        lines = lines.slice(1);

        if (lines[0] === '') {
            lines = lines.slice(1);
        }
    }

    const sanitized = lines.map((line) => {
        const match = line.match(/^(\p{Extended_Pictographic})\s+/u);

        if (!match) {
            return line;
        }

        const glyph = match[1];

        if (budget.has(glyph)) {
            return line.slice(match[0].length);
        }

        budget.takeLiteral(glyph);
        return line;
    });

    return sanitized.join('\n').trim();
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {string} content
 */
function addTextBlock(container, content) {
    if (!content) {
        return;
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
    );
}

/**
 * @param {(key: string) => string} tr
 * @param {string} emojiKey
 */
function resolveEmoji(tr, emojiKey) {
    return uiEmoji(tr, emojiKey) || '';
}

/** @deprecated Use buildStatBlock with EmojiBudget */
function buildStatStrip(stats) {
    return clipV2Text(stats?.map((stat) => `**${stat.value}** ${stat.label}`).join('\n') || '');
}

module.exports = {
    EmojiBudget,
    createEmojiBudget,
    formatBreadcrumbLine,
    buildSubtitle,
    buildDashboardHeader,
    buildStatLine,
    buildStatLines,
    buildStatBlock,
    buildStatStripInline,
    buildStatSections,
    buildStatStrip,
    buildCallout,
    buildSectionHeading,
    buildKeyValueList,
    buildLabeledBlock,
    buildRoleFooter,
    sanitizeLeagueTextContent,
    addTextBlock,
    resolveEmoji,
};