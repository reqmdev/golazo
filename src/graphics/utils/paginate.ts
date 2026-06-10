import { layout } from '../tokens/layout';

export function paginateTable<T>(
  rows: T[],
  options: { page?: number; pageSize?: number } = {},
) {
  const pageSize = options.pageSize ?? layout.maxRowsPerPage;
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