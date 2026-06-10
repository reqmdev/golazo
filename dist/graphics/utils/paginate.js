"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateTable = paginateTable;
const layout_1 = require("../tokens/layout");
function paginateTable(rows, options = {}) {
    const pageSize = options.pageSize ?? layout_1.layout.maxRowsPerPage;
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
        hasPagination: totalPages > 1,
    };
}
//# sourceMappingURL=paginate.js.map