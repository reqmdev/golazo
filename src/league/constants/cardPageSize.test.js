const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { CARD_PAGE_SIZES } = require('./cardPageSize');
const { DEFAULT_TEAM_LIMITS } = require('./defaults');
const { paginateTable } = require('../render/drawing/paginateTable');

describe('cardPageSize', () => {
    it('fits full league on a single standings page', () => {
        const rows = Array.from({ length: DEFAULT_TEAM_LIMITS.maxTeams }, (_, i) => ({ id: i }));
        const page = paginateTable(rows, { pageSize: CARD_PAGE_SIZES.standings });

        assert.equal(page.totalPages, 1);
        assert.equal(page.rows.length, DEFAULT_TEAM_LIMITS.maxTeams);
        assert.equal(page.hasPagination, false);
    });

    it('fits full round of matches on a single fixture page', () => {
        const matchCount = Math.floor(DEFAULT_TEAM_LIMITS.maxTeams / 2);
        const rows = Array.from({ length: matchCount }, (_, i) => ({ id: i }));
        const page = paginateTable(rows, { pageSize: CARD_PAGE_SIZES.fixture });

        assert.equal(page.totalPages, 1);
        assert.equal(page.rows.length, matchCount);
    });
});