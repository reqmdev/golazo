const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildHelpColors, CANVAS_WIDTH, HELP_FOOTER_HEIGHT, hexToDiscordColor, PAGE_ACCENTS } = require('./tokens');
const { renderHelpFooter } = require('../help/renderHelpAssets');
const { createTranslator } = require('../i18n');

describe('canvas', () => {
    it('exposes modern sports-app dimensions', () => {
        assert.equal(CANVAS_WIDTH, 1200);
        assert.equal(HELP_FOOTER_HEIGHT, 120);
    });

    it('builds help colors from page accents', () => {
        const colors = buildHelpColors();
        assert.equal(colors.overview, hexToDiscordColor(PAGE_ACCENTS.overview));
        assert.equal(colors.league_step_5, hexToDiscordColor(PAGE_ACCENTS.league_step_5));
    });

    it('renders help footer PNG', async () => {
        const tr = createTranslator('en');
        const buffer = await renderHelpFooter('league_step_1', tr);
        assert.ok(Buffer.isBuffer(buffer));
        assert.ok(buffer.length > 500);
        assert.equal(buffer[0], 0x89);
        assert.equal(buffer[1], 0x50);
    });
});