const { clipV2Text } = require('../../ui/ComponentsV2Factory');
const { createEmojiBudget, buildStatStripInline } = require('./layout');

const DEFAULT_MAX_COL = 28;
const CELL_GAP = ' │ ';
const ELLIPSIS = '…';

/** @type {Intl.Segmenter | null} */
let graphemeSegmenter = null;

function getGraphemeSegmenter() {
    if (!graphemeSegmenter && typeof Intl !== 'undefined' && Intl.Segmenter) {
        graphemeSegmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    }

    return graphemeSegmenter;
}

/**
 * @param {string} text
 */
function splitGraphemes(text) {
    const segmenter = getGraphemeSegmenter();

    if (segmenter) {
        return [...segmenter.segment(text)].map((part) => part.segment);
    }

    return [...text];
}

/**
 * @param {string} grapheme
 */
function graphemeWidth(grapheme) {
    if (!grapheme) {
        return 0;
    }

    if (/\p{Extended_Pictographic}/u.test(grapheme)) {
        return 2;
    }

    const codePoint = grapheme.codePointAt(0) ?? 0;

    if (codePoint >= 0x1100 && (
        (codePoint >= 0x1100 && codePoint <= 0x115F)
        || (codePoint >= 0x2E80 && codePoint <= 0xA4CF)
        || (codePoint >= 0xAC00 && codePoint <= 0xD7A3)
        || (codePoint >= 0xF900 && codePoint <= 0xFAFF)
        || (codePoint >= 0xFE10 && codePoint <= 0xFE1F)
        || (codePoint >= 0xFE30 && codePoint <= 0xFE6F)
        || (codePoint >= 0xFF00 && codePoint <= 0xFF60)
        || (codePoint >= 0xFFE0 && codePoint <= 0xFFE6)
    )) {
        return 2;
    }

    return 1;
}

/**
 * @param {string} value
 */
function normalizeCell(value) {
    return String(value ?? '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * @param {string} text
 */
function measureWidth(text) {
    return splitGraphemes(String(text ?? ''))
        .reduce((sum, grapheme) => sum + graphemeWidth(grapheme), 0);
}

/**
 * @param {string} text
 */
function displayWidth(text) {
    return measureWidth(normalizeCell(text));
}

/**
 * @param {string} text
 * @param {number} maxWidth
 */
function truncateCell(text, maxWidth) {
    const normalized = normalizeCell(text);

    if (measureWidth(normalized) <= maxWidth) {
        return normalized;
    }

    let result = '';
    let width = 0;
    const budget = Math.max(1, maxWidth - measureWidth(ELLIPSIS));

    for (const grapheme of splitGraphemes(normalized)) {
        const next = graphemeWidth(grapheme);

        if (width + next > budget) {
            break;
        }

        result += grapheme;
        width += next;
    }

    return `${result}${ELLIPSIS}`;
}

/**
 * @param {string} text
 * @param {number} width
 */
function padCell(text, width) {
    const normalized = truncateCell(text, width);
    const current = measureWidth(normalized);

    if (current >= width) {
        return normalized;
    }

    return `${normalized}${' '.repeat(width - current)}`;
}

/**
 * Divider width is taken from the rendered header row so lines never drift.
 * @param {string} headerLine
 */
function buildDivider(headerLine) {
    return '─'.repeat(Math.max(measureWidth(headerLine), 3));
}

/**
 * @param {{ header: string, maxWidth?: number, minWidth?: number }[]} columns
 * @param {string[][]} rows
 * @param {{ wrapCode?: boolean, includeDivider?: boolean, titleLine?: string }} [options]
 */
function buildTable(columns, rows, options = {}) {
    const { wrapCode = true, includeDivider = true, titleLine = '' } = options;

    if (!columns?.length) {
        return '';
    }

    const widths = columns.map((column, index) => {
        let width = displayWidth(column.header);

        for (const row of rows) {
            width = Math.max(width, displayWidth(row[index] ?? ''));
        }

        const minWidth = column.minWidth ?? 3;
        const maxWidth = column.maxWidth ?? DEFAULT_MAX_COL;
        return Math.min(Math.max(width, minWidth), maxWidth);
    });

    /**
     * @param {(string | undefined)[]} cells
     */
    const formatRow = (cells) => cells
        .map((cell, index) => padCell(cell ?? '', widths[index]))
        .join(CELL_GAP);

    const headerLine = formatRow(columns.map((column) => column.header));
    const divider = includeDivider ? buildDivider(headerLine) : '';
    const bodyLines = rows.map((row) => formatRow(row));
    const table = [
        titleLine || null,
        headerLine,
        divider || null,
        ...bodyLines,
    ].filter(Boolean);
    const content = wrapCode ? `\`\`\`\n${table.join('\n')}\n\`\`\`` : table.join('\n');

    return clipV2Text(content);
}

/**
 * @param {[string, string][]} rows
 * @param {string} labelHeader
 * @param {string} valueHeader
 */
function buildKeyValueTable(rows, labelHeader, valueHeader) {
    return buildTable(
        [
            { header: labelHeader, maxWidth: 22 },
            { header: valueHeader, maxWidth: 38 },
        ],
        rows.map(([label, value]) => [label, value]),
    );
}

/**
 * Stats are NOT rendered as code-block tables (avoids "lig / ──── / 1/10").
 * @param {{ label: string, value: string, emojiKeys?: string[], emojiLiteral?: string }[]} stats
 * @param {import('./layout').EmojiBudget} [budget]
 */
function buildStatsTable(stats, budget) {
    if (!stats?.length) {
        return '';
    }

    const resolvedBudget = budget ?? createEmojiBudget(() => '');

    return buildStatStripInline(stats, resolvedBudget);
}

module.exports = {
    buildTable,
    buildKeyValueTable,
    buildStatsTable,
    normalizeCell,
    padCell,
    displayWidth,
    measureWidth,
    graphemeWidth,
};