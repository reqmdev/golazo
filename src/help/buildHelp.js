const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
} = require('discord.js');
const { HELP_COLORS, HELP_SELECT_ID, HELP_PAGE_IDS } = require('./constants');
const { getPageVisual } = require('./visualMeta');
const { finalizeV2Payload, clipV2Text } = require('../ui/ComponentsV2Factory');

/**
 * @param {string} pageId
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 */
function resolveHelpFields(pageId, tr) {
    const fieldCount = Number(tr(`help.pages.${pageId}.fieldCount`) || 0);
    /** @type {{ name: string, value: string, inline: boolean }[]} */
    const fields = [];

    for (let i = 1; i <= fieldCount; i++) {
        const name = tr(`help.pages.${pageId}.field${i}Name`);
        const value = tr(`help.pages.${pageId}.field${i}Value`);
        const inline = tr(`help.pages.${pageId}.field${i}Inline`) !== 'false';

        if (name.startsWith('help.') || value.startsWith('help.')) {
            continue;
        }

        fields.push({ name, value, inline });
    }

    return fields;
}

/**
 * @param {string} pageId
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 */
function buildHelpContent(pageId, tr) {
    const visual = getPageVisual(pageId);
    const title = tr(`help.pages.${pageId}.title`);
    const description = tr(`help.pages.${pageId}.description`);
    const safeTitle = title.startsWith('help.') ? pageId : title;
    const safeDescription = description.startsWith('help.pages.') ? '' : description;

    const lines = [`### ${visual.emoji} ${safeTitle}`];

    if (safeDescription) {
        lines.push('', safeDescription);
    }

    for (const field of resolveHelpFields(pageId, tr)) {
        if (field.inline) {
            lines.push('', `**${field.name}** — ${field.value}`);
        } else {
            lines.push('', `**${field.name}**`, field.value);
        }
    }

    return clipV2Text(lines.join('\n').trim());
}

/**
 * @param {string} activePageId
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 */
function buildHelpSelect(activePageId, tr) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId(HELP_SELECT_ID)
        .setPlaceholder(tr('help.selectPlaceholder'))
        .addOptions(
            HELP_PAGE_IDS.map((pageId) => {
                const visual = getPageVisual(pageId);
                const emoji = tr(`help.menu.${pageId}.emoji`) || visual.emoji;
                const option = {
                    label: tr(`help.menu.${pageId}.label`).slice(0, 100),
                    description: tr(`help.menu.${pageId}.description`).slice(0, 100),
                    value: pageId,
                    default: pageId === activePageId,
                };

                if (emoji && !emoji.startsWith('help.')) {
                    option.emoji = emoji;
                }

                return option;
            }),
        );

    return new ActionRowBuilder().addComponents(menu);
}

/**
 * @param {string} pageId
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 * @param {string} [_locale]
 */
async function buildHelpPayload(pageId, tr, _locale) {
    const accentColor = HELP_COLORS[pageId] ?? HELP_COLORS.overview;
    const footer = tr(`help.pages.${pageId}.footer`);
    const safeFooter = footer && !footer.startsWith('help.pages.') ? footer : null;

    const container = new ContainerBuilder().setAccentColor(accentColor);

    const content = buildHelpContent(pageId, tr);

    if (content) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content),
        );
    }

    if (safeFooter) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(clipV2Text(`-# ${safeFooter}`)),
        );
    }

    container.addActionRowComponents(buildHelpSelect(pageId, tr));

    return finalizeV2Payload({
        files: [],
        components: [container],
    });
}

module.exports = {
    buildHelpSelect,
    buildHelpPayload,
};