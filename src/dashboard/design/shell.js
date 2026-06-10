const {
    ContainerBuilder,
    AttachmentBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ComponentType,
} = require('discord.js');
const { finalizeV2Payload } = require('../../ui/ComponentsV2Factory');
const { resolveDashboardAccent } = require('./tokens');
const {
    createEmojiBudget,
    sanitizeLeagueTextContent,
} = require('./layout');
const { buildDashboardBreadcrumb, resolvePanelEmojiKey } = require('./context');
const { buildStatsTable } = require('./table');
const { resolveDashboardHero } = require('./hero');
const {
    addSeparator,
    addZone,
    addHeroGallery,
    LAYOUT_GAP,
} = require('./compose');
const {
    joinZone,
    buildPageTitle,
    buildContextLine,
    buildControlHint,
    buildMetaRole,
    buildMetaBlock,
    buildMetaTrail,
} = require('./typography');

/**
 * @param {object} input
 * @param {import('./layout').EmojiBudget} budget
 */
function buildShellMeta(input, budget) {
    const {
        tr,
        footerRole,
        breadcrumb = '',
        metaLines = [],
        compact = false,
    } = input;

    if (compact) {
        return '';
    }

    return buildMetaBlock([
        buildMetaRole(tr, footerRole, budget),
        buildMetaTrail(breadcrumb),
        ...metaLines,
    ]);
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {object[]} parts
 * @param {import('./layout').EmojiBudget} budget
 */
function appendLeagueContentParts(container, parts, budget) {
    if (!parts?.length) {
        return;
    }

    let priorContent = false;

    for (const part of parts) {
        if (part.type === ComponentType.TextDisplay && part.content) {
            const content = sanitizeLeagueTextContent(part.content, budget);

            if (content) {
                if (priorContent) {
                    addSeparator(container, LAYOUT_GAP.SECTION);
                }

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(content),
                );
                priorContent = true;
            }
        } else if (part.type === ComponentType.MediaGallery && part.items?.length) {
            if (priorContent) {
                addSeparator(container, LAYOUT_GAP.VISUAL);
            }

            const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
            const gallery = new MediaGalleryBuilder();

            for (const item of part.items) {
                gallery.addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(item.media?.url || item.url)
                        .setDescription(item.description || 'Golazo'),
                );
            }

            container.addMediaGalleryComponents(gallery);
            priorContent = true;
        }
    }
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {object[]} actionRowParts
 */
function appendActionRowParts(container, actionRowParts) {
    for (const part of actionRowParts) {
        if (part.type === ComponentType.ActionRow) {
            container.addActionRowComponents(ActionRowBuilder.from(part));
        }
    }
}

/**
 * Legacy league V2 cards embed title/meta/hint as TextDisplay parts.
 * Dashboard chrome already covers these — drop when merging visual panels.
 *
 * @param {object} part
 */
function isLegacyLeagueChromePart(part) {
    if (part.type !== ComponentType.TextDisplay) {
        return false;
    }

    const content = part.content || '';

    if (content.startsWith('### ') || content.startsWith('-# ')) {
        return true;
    }

    return false;
}

/**
 * @param {import('discord.js').InteractionReplyOptions} leaguePayload
 * @param {{ stripLegacyChrome?: boolean }} [options]
 */
function splitLeagueContainerParts(leaguePayload, options = {}) {
    const { stripLegacyChrome = false } = options;
    const container = leaguePayload.components?.[0];
    const json = container?.toJSON?.() ?? { components: [] };
    const contentParts = json.components.filter((part) => {
        if (part.type === ComponentType.ActionRow || part.type === ComponentType.Separator) {
            return false;
        }

        if (stripLegacyChrome && isLegacyLeagueChromePart(part)) {
            return false;
        }

        return true;
    });
    const actionRowParts = json.components.filter((part) => part.type === ComponentType.ActionRow);

    return { contentParts, actionRowParts };
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {{ buffer: Buffer, filename: string }} media
 * @param {string} [description]
 */
function addMediaGallery(container, media, description) {
    if (!media?.buffer || !media?.filename) {
        return null;
    }

    const file = new AttachmentBuilder(media.buffer, { name: media.filename });
    addHeroGallery(container, media, description);
    return file;
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {import('discord.js').ActionRowBuilder[]} rows
 */
function appendActionRows(container, rows) {
    for (const row of rows) {
        if (row) {
            container.addActionRowComponents(row);
        }
    }
}

/**
 * @param {object} input
 */
function buildDashboardShell(input) {
    const {
        view,
        tr,
        title,
        subtitle,
        breadcrumb: breadcrumbOverride,
        guildName,
        slug,
        stats = [],
        chromeBuilder,
        body,
        bodyBuilder,
        bodySections = [],
        bodySectionBuilder,
        hint,
        hintTone = 'info',
        callout,
        calloutTone = 'info',
        footerRole,
        metaLines = [],
        accentColor,
        media,
        mediaDescription,
        hero,
        includeHero = false,
        actionRows = [],
        externalActionRows = [],
        skipContentSeparator = false,
        compact = false,
        ephemeral = false,
        budget: externalBudget,
        deferMeta = false,
    } = input;

    const resolvedHint = hint ?? callout;
    const resolvedHintTone = (hint ?? callout) ? (hintTone ?? calloutTone) : 'info';

    const emojiKey = resolvePanelEmojiKey(view);
    const budget = externalBudget ?? createEmojiBudget(tr);
    const container = new ContainerBuilder()
        .setAccentColor(accentColor ?? resolveDashboardAccent(view));

    const files = [];
    const breadcrumb = deferMeta
        ? (breadcrumbOverride ?? '')
        : (breadcrumbOverride
            ?? ((guildName != null || slug)
                ? buildDashboardBreadcrumb(tr, guildName || '', slug, budget)
                : ''));

    const chromeExtra = typeof chromeBuilder === 'function' ? chromeBuilder(budget) : '';

    const chromeZone = joinZone([
        buildPageTitle(tr, emojiKey, title, budget),
        buildContextLine(subtitle || ''),
        chromeExtra,
        buildStatsTable(stats, budget),
    ]);
    addZone(container, chromeZone);

    const heroMedia = includeHero ? (hero ?? resolveDashboardHero(view)) : null;

    if (heroMedia?.buffer) {
        addSeparator(container, LAYOUT_GAP.VISUAL);
        files.push(new AttachmentBuilder(heroMedia.buffer, { name: heroMedia.filename }));
        addHeroGallery(container, heroMedia, title);
    }

    const resolvedBody = typeof bodyBuilder === 'function'
        ? bodyBuilder(budget)
        : body;

    const contentGap = skipContentSeparator ? null : LAYOUT_GAP.SECTION;

    if (resolvedBody) {
        addZone(container, resolvedBody, contentGap);
    } else {
        const resolvedBodySections = typeof bodySectionBuilder === 'function'
            ? bodySectionBuilder(budget)
            : bodySections;

        if (resolvedBodySections?.length) {
            const legacyBody = resolvedBodySections
                .map((section) => section.lines?.filter(Boolean).join('\n'))
                .filter(Boolean)
                .join('\n\n');

            if (legacyBody) {
                addZone(container, legacyBody, contentGap);
            }
        }
    }

    if (media?.buffer && media?.filename) {
        addSeparator(container, LAYOUT_GAP.VISUAL);
        const file = addMediaGallery(container, media, mediaDescription || title);

        if (file) {
            files.push(file);
        }
    }

    if (!deferMeta) {
        const metaBlock = buildShellMeta({
            tr,
            footerRole,
            breadcrumb,
            metaLines,
            compact,
        }, budget);

        if (metaBlock) {
            addZone(container, metaBlock, LAYOUT_GAP.META);
        }
    }

    const trailingRows = externalActionRows.filter(Boolean);

    if (resolvedHint) {
        addZone(container, buildControlHint(resolvedHint, resolvedHintTone, budget));
    }

    appendActionRows(container, actionRows);
    appendActionRows(container, trailingRows);

    return finalizeV2Payload({
        files,
        components: [container],
    }, ephemeral);
}

/**
 * @param {object} input
 */
function wrapVisualPanel(input) {
    const { chrome, leaguePayload, prependRows = [], backRow, externalActionRows = [] } = input;
    const { contentParts, actionRowParts } = splitLeagueContainerParts(leaguePayload, {
        stripLegacyChrome: true,
    });
    const budget = createEmojiBudget(chrome.tr);

    const resolvedHint = chrome.hint ?? chrome.callout;
    const resolvedHintTone = chrome.hint ?? chrome.callout
        ? (chrome.hintTone ?? chrome.calloutTone ?? 'info')
        : 'info';

    const shell = buildDashboardShell({
        ...chrome,
        budget,
        includeHero: false,
        actionRows: [],
        externalActionRows: [],
        deferMeta: true,
        hint: undefined,
        callout: undefined,
    });

    const shellContainer = shell.components[0];

    const files = [...(shell.files || [])];
    const seenNames = new Set(files.map((file) => file.name));

    for (const file of leaguePayload.files || []) {
        const normalized = file instanceof AttachmentBuilder
            ? file
            : new AttachmentBuilder(file.buffer ?? file.attachment, {
                name: file.name ?? file.filename,
            });

        if (!seenNames.has(normalized.name)) {
            seenNames.add(normalized.name);
            files.push(normalized);
        }
    }

    if (contentParts.length) {
        addSeparator(shellContainer, LAYOUT_GAP.VISUAL);
        appendLeagueContentParts(shellContainer, contentParts, budget);
    }

    const metaBlock = buildShellMeta({
        tr: chrome.tr,
        footerRole: chrome.footerRole,
        breadcrumb: chrome.breadcrumb
            ?? ((chrome.guildName != null || chrome.slug)
                ? buildDashboardBreadcrumb(chrome.tr, chrome.guildName || '', chrome.slug, budget)
                : ''),
        metaLines: chrome.metaLines,
        compact: chrome.compact,
    }, budget);

    if (metaBlock) {
        addZone(shellContainer, metaBlock, LAYOUT_GAP.META);
    }

    const controlRows = [
        ...prependRows,
        ...actionRowParts.map((part) => ActionRowBuilder.from(part)),
        backRow,
        ...externalActionRows,
    ].filter(Boolean);

    if (resolvedHint) {
        addZone(shellContainer, buildControlHint(resolvedHint, resolvedHintTone, budget));
    }

    appendActionRows(shellContainer, controlRows);

    return finalizeV2Payload({
        files,
        components: [shellContainer],
    });
}

module.exports = {
    buildDashboardShell,
    wrapVisualPanel,
    splitLeagueContainerParts,
    isLegacyLeagueChromePart,
    addMediaGallery,
    buildShellMeta,
};