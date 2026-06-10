const {
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require('discord.js');
const { clipV2Text } = require('../../ui/ComponentsV2Factory');

const LAYOUT_GAP = {
    SECTION: SeparatorSpacingSize.Small,
    META: SeparatorSpacingSize.Small,
    VISUAL: SeparatorSpacingSize.Large,
};

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {import('discord-api-types/v10').SeparatorSpacingSize} [size]
 */
function addSeparator(container, size = SeparatorSpacingSize.Small) {
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(size),
    );
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {string} content
 */
function addTextZone(container, content) {
    if (!content) {
        return;
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(clipV2Text(content)),
    );
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {string} content
 * @param {import('discord-api-types/v10').SeparatorSpacingSize | null} [separatorBefore]
 */
function addZone(container, content, separatorBefore = null) {
    if (!content) {
        return;
    }

    if (separatorBefore != null) {
        addSeparator(container, separatorBefore);
    }

    addTextZone(container, content);
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {{ lines: string[] }[]} sections
 */
function addSectionStack(container, sections) {
    if (!sections?.length) {
        return;
    }

    for (let index = 0; index < sections.length; index++) {
        const content = sections[index].lines.filter(Boolean).join('\n');

        if (!content) {
            continue;
        }

        if (index > 0) {
            addSeparator(container, SeparatorSpacingSize.Small);
        }

        addTextZone(container, content);
    }
}

/**
 * @param {import('discord.js').ContainerBuilder} container
 * @param {{ buffer: Buffer, filename: string }} media
 * @param {string} [description]
 */
function addHeroGallery(container, media, description) {
    if (!media?.buffer || !media?.filename) {
        return null;
    }

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder()
                .setURL(`attachment://${media.filename}`)
                .setDescription(clipV2Text(description || 'Golazo', 256)),
        ),
    );

    return media.filename;
}

module.exports = {
    addSeparator,
    addTextZone,
    addZone,
    addSectionStack,
    addHeroGallery,
    LAYOUT_GAP,
    SeparatorSpacingSize,
};