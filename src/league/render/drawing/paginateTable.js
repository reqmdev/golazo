const { LAYOUT } = require('../constants/layout');

/**
 * Split rows into pages for canvas rendering.
 *
 * @param {object[]} rows
 * @param {{ page?: number, pageSize?: number }} [options]
 */
function paginateTable(rows, options = {}) {
    const pageSize = options.pageSize ?? LAYOUT.maxRowsPerPage;
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(Math.max(options.page ?? 1, 1), totalPages);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
        rows: rows.slice(start, end),
        page,
        totalPages,
        pageSize,
        totalRows: rows.length,
        hasPagination: totalPages > 1
    };
}

module.exports = { paginateTable };