const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    resolveCardContentArea,
    cardIconOpticalInset,
    sumColumnWidths,
} = require('../../../dist/graphics/utils/contentBlock');
const { STANDINGS_COLUMN_LAYOUT } = require('../../../dist/graphics/tokens/standingsGrid');
const { TEAMS_COLUMN_LAYOUT } = require('../../../dist/graphics/tokens/teamsGrid');
const { CANVAS_WIDTH } = require('../../../dist/graphics/tokens/layout');
const { layout } = require('../../../dist/graphics/tokens/layout');

describe('contentBlock', () => {
    it('fits data grids inside optically balanced content area', () => {
        const contentWidth = CANVAS_WIDTH - layout.padding * 2;

        assert.equal(sumColumnWidths(STANDINGS_COLUMN_LAYOUT), contentWidth - cardIconOpticalInset * 2);
        assert.equal(sumColumnWidths(TEAMS_COLUMN_LAYOUT), contentWidth - cardIconOpticalInset * 2);

        const standingsArea = resolveCardContentArea(contentWidth, sumColumnWidths(STANDINGS_COLUMN_LAYOUT));
        const teamsArea = resolveCardContentArea(contentWidth, sumColumnWidths(TEAMS_COLUMN_LAYOUT));

        assert.equal(standingsArea.originX, cardIconOpticalInset);
        assert.equal(teamsArea.originX, cardIconOpticalInset);
        assert.equal(standingsArea.width, contentWidth - cardIconOpticalInset * 2);
        assert.equal(
            standingsArea.originX + standingsArea.width + cardIconOpticalInset,
            contentWidth,
        );
    });
});