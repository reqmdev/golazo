const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { LAYOUT, computeCanvasHeight } = require('./layout');

describe('computeCanvasHeight', () => {
    it('fits max rows per page including gaps and footer', () => {
        const rowCount = LAYOUT.maxRowsPerPage;
        const height = computeCanvasHeight({ rowCount, extra: 8 });

        const tableBlock = LAYOUT.tableHeaderHeight
            + LAYOUT.tableHeaderGap
            + rowCount * LAYOUT.rowHeight
            + (rowCount - 1) * LAYOUT.rowGap;

        const contentBottom = LAYOUT.padding
            + LAYOUT.headerHeight
            + LAYOUT.headerGap
            + tableBlock;

        assert.ok(contentBottom + LAYOUT.footerHeight + 8 <= height);
    });
});