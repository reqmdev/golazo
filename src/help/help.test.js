const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags, ComponentType } = require('discord.js');
const { createTranslator } = require('../i18n');
const { buildHelpPayload } = require('./buildHelp');
const { DEFAULT_HELP_PAGE, HELP_SELECT_ID } = require('./constants');

describe('help', () => {
    const tr = createTranslator('en');

    it('builds V2 help with select menu and no banner image', async () => {
        const payload = await buildHelpPayload(DEFAULT_HELP_PAGE, tr, 'en');
        const container = payload.components[0].toJSON();

        assert.equal(payload.flags, MessageFlags.IsComponentsV2);
        assert.equal(payload.embeds.length, 0);
        assert.equal(payload.files.length, 0);

        const actionRows = container.components.filter((part) => part.type === ComponentType.ActionRow);
        assert.equal(actionRows.length, 1);
        assert.equal(actionRows[0].components[0].custom_id, HELP_SELECT_ID);

        assert.ok(!container.components.some((part) => part.type === ComponentType.MediaGallery));
    });

    it('includes page title and description in text display', async () => {
        const payload = await buildHelpPayload('overview', tr, 'en');
        const container = payload.components[0].toJSON();
        const text = container.components
            .filter((part) => part.type === ComponentType.TextDisplay)
            .map((part) => part.content)
            .join('\n');

        assert.match(text, /Quick start/);
        assert.match(text, /6 commands/);
    });
});