const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags, ComponentType } = require('discord.js');
const { createTranslator } = require('../i18n');
const {
    buildLeagueCardV2Payload,
    isComponentsV2Payload,
    formatV2Title,
} = require('./ComponentsV2Factory');
const { buildFixtureV2Reply, buildStandingsV2Reply } = require('../league/utils/visualV2Reply');
const { buildV2MetaBlock } = require('../league/utils/v2Meta');
const { VARIANT_COLORS } = require('./tokens');

describe('ComponentsV2', () => {
    const tr = createTranslator('tr');

    it('builds standings payload with Components V2 flag and no embeds', () => {
        const payload = buildStandingsV2Reply({
            tr,
            titleKey: 'handlers.standings.title',
            titleParams: { name: 'Süper Lig', pageLabel: '' },
            slug: 'super-lig',
            page: 1,
            totalPages: 1,
            fallbackContent: 'table',
            renderResult: {
                buffer: Buffer.from('png'),
                filename: 'standings-super-lig-p1.png',
            },
        });

        assert.equal(payload.embeds.length, 0);
        assert.equal(payload.content, '');
        assert.equal(payload.flags, MessageFlags.IsComponentsV2);
        assert.ok(isComponentsV2Payload(payload));
        assert.equal(payload.files.length, 1);
        assert.equal(payload.files[0].name, 'standings-super-lig-p1.png');
        assert.equal(payload.components.length, 1);

        const container = payload.components[0].toJSON();
        assert.equal(container.type, ComponentType.Container);
        assert.equal(container.accent_color, VARIANT_COLORS.brand);
        assert.ok(container.components.some((part) => part.type === ComponentType.MediaGallery));
        assert.ok(!container.components.some((part) => part.type === ComponentType.Separator));
    });

    it('uses text body fallback when image is missing', () => {
        const payload = buildStandingsV2Reply({
            tr,
            titleKey: 'handlers.standings.title',
            titleParams: { name: 'Süper Lig', pageLabel: '' },
            slug: 'super-lig',
            fallbackContent: '#  Takım  P',
            renderResult: null,
        });

        const container = payload.components[0].toJSON();
        const textParts = container.components.filter((part) => part.type === ComponentType.TextDisplay);
        const body = textParts.find((part) => part.content.includes('Takım'));

        assert.ok(body);
        assert.equal(payload.files.length, 0);
        assert.ok(!container.components.some((part) => part.type === ComponentType.Separator));
    });

    it('formats markdown titles without emoji for text display', () => {
        const title = formatV2Title(
            tr,
            'handlers.standings.title',
            { name: 'Süper Lig', pageLabel: '' },
        );

        assert.match(title, /^### /);
        assert.match(title, /Süper Lig/);
        assert.doesNotMatch(title, /[\u{1F300}-\u{1FAFF}]/u);
    });

    it('builds fixture payload with nav rows inside the container', () => {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const navRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('lfx:test:1:1:nr')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary),
        );

        const payload = buildFixtureV2Reply({
            tr,
            slug: 'super-lig',
            page: 1,
            totalPages: 1,
            titleParams: { name: 'Süper Lig', round: 1, totalRounds: 6, pageLabel: '' },
            fallbackContent: 'match list',
            renderResult: {
                buffer: Buffer.from('png'),
                filename: 'fixture-super-lig-r1-p1.png',
            },
            actionRows: [navRow],
        });

        assert.equal(payload.flags, MessageFlags.IsComponentsV2);
        const container = payload.components[0].toJSON();
        assert.ok(container.components.some((part) => part.type === ComponentType.ActionRow));
        assert.ok(container.components.some((part) => part.type === ComponentType.MediaGallery));
        assert.ok(!container.components.some((part) => part.type === ComponentType.Separator));
    });

    it('buildLeagueCardV2Payload supports custom accent', () => {
        const payload = buildLeagueCardV2Payload({
            tr,
            headingKey: 'handlers.standings.title',
            headingParams: { name: 'Test', pageLabel: '' },
            footer: 'Footer',
            accentVariant: 'info',
        });

        const container = payload.components[0].toJSON();
        assert.equal(container.accent_color, VARIANT_COLORS.info);
    });

    it('visual mode shows labeled stacked meta block above the image', () => {
        const meta = buildV2MetaBlock(tr, {
            viewEmojiKey: 'fixture',
            viewTitleKey: 'common.v2ViewFixture',
            name: 'Süper Lig',
            slug: 'super-lig',
            round: 3,
            totalRounds: 6,
            page: 2,
            totalPages: 3,
        });

        assert.match(meta, /### .*Fikstür/);
        assert.match(meta, /Lig.*Süper Lig/);
        assert.match(meta, /Lig kodu.*super-lig/);
        assert.match(meta, /Hafta.*3.*6/);
        assert.match(meta, /Sayfa.*2.*3/);

        const payload = buildFixtureV2Reply({
            tr,
            slug: 'super-lig',
            page: 2,
            totalPages: 3,
            titleParams: { name: 'Süper Lig', round: 3, totalRounds: 6, pageLabel: '' },
            fallbackContent: 'match list',
            renderResult: {
                buffer: Buffer.from('png'),
                filename: 'fixture-super-lig-r3-p2.png',
            },
            actionRows: [],
        });

        const container = payload.components[0].toJSON();
        const textParts = container.components.filter((part) => part.type === ComponentType.TextDisplay);
        const metaPart = textParts[0];

        assert.ok(metaPart);
        assert.match(metaPart.content, /Lig kodu/);
        assert.match(metaPart.content, /Hafta/);
    });
});