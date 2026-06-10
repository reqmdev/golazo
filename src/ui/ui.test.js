const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags, ComponentType } = require('discord.js');
const { createTranslator } = require('../i18n');
const { AttachmentBuilder } = require('discord.js');
const { clip } = require('./EmbedFactory');
const { authorName, uiEmoji, titled } = require('./emoji');
const {
    buildInfoCardV2Payload,
    finalizeV2Payload,
    isComponentsV2Payload,
} = require('./ComponentsV2Factory');
const { VARIANT_COLORS } = require('./tokens');

describe('ui', () => {
    const trEn = createTranslator('en');
    const trTr = createTranslator('tr');

    it('clips long text with ellipsis', () => {
        assert.equal(clip('hello', 10), 'hello');
        assert.equal(clip('abcdefghij', 5), 'abcd…');
    });

    it('resolves ui emoji keys in en and tr', () => {
        assert.ok(uiEmoji(trEn, 'brand'));
        assert.ok(uiEmoji(trTr, 'league'));
        assert.equal(uiEmoji(trEn, 'nonexistent'), '');
    });

    it('builds author name without emoji prefix', () => {
        assert.equal(authorName(trEn), 'Golazo');
        assert.equal(authorName(trTr), 'Golazo');
    });

    it('titles with optional emoji prefix', () => {
        assert.equal(titled(trEn, 'Standings', 'standings'), `${uiEmoji(trEn, 'standings')} Standings`);
        assert.equal(titled(trEn, 'Plain'), 'Plain');
    });

    it('buildInfoCardV2Payload sets variant accent and Components V2 flag', () => {
        const payload = buildInfoCardV2Payload({
            tr: trEn,
            variant: 'league',
            title: 'Test League',
            description: 'Description text',
        });

        assert.equal(payload.embeds.length, 0);
        assert.equal(payload.content, '');
        assert.ok(isComponentsV2Payload(payload));

        const container = payload.components[0].toJSON();
        assert.equal(container.type, ComponentType.Container);
        assert.equal(container.accent_color, VARIANT_COLORS.league);
        assert.ok(container.components.some((part) => part.type === ComponentType.TextDisplay));
    });

    it('buildInfoCardV2Payload resolves inline fields from keys', () => {
        const payload = buildInfoCardV2Payload({
            tr: trEn,
            variant: 'full',
            titleKey: 'handlers.create.success',
            titleParams: { name: 'Super Lig' },
            fields: [
                {
                    valueKey: 'handlers.create.slug',
                    valueParams: { slug: 'super-lig' },
                }
            ],
        });

        const container = payload.components[0].toJSON();
        const text = container.components
            .filter((part) => part.type === ComponentType.TextDisplay)
            .map((part) => part.content)
            .join('\n');

        assert.match(text, /Super Lig/);
        assert.match(text, /super-lig/);
    });

    it('buildInfoCardV2Payload compact tone uses warning styling', () => {
        const payload = buildInfoCardV2Payload({
            tr: trEn,
            variant: 'compact',
            tone: 'warning',
            description: 'Slow down',
            compact: true,
        });

        const container = payload.components[0].toJSON();
        assert.equal(container.accent_color, VARIANT_COLORS.warning);
        assert.match(
            container.components.find((part) => part.type === ComponentType.TextDisplay).content,
            /Slow down/,
        );
    });

    it('finalizeV2Payload maps buffers to attachments and respects ephemeral', () => {
        const payload = finalizeV2Payload(buildInfoCardV2Payload({
            tr: trEn,
            description: 'ok',
            extraFiles: [{ buffer: Buffer.from('png'), filename: 'card.png' }],
        }), true);

        assert.equal(payload.files.length, 1);
        assert.equal(payload.files[0].name, 'card.png');
        assert.equal(payload.flags, MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral);
    });

    it('buildInfoCardV2Payload accepts AttachmentBuilder in extraFiles', () => {
        const payload = buildInfoCardV2Payload({
            tr: trEn,
            description: 'ok',
            extraFiles: [
                new AttachmentBuilder(Buffer.from('data'), { name: 'output.ts' }),
            ],
        });

        assert.equal(payload.files.length, 1);
        assert.ok(payload.files[0] instanceof AttachmentBuilder);
        assert.equal(payload.files[0].name, 'output.ts');
    });
});