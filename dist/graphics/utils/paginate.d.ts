export declare function paginateTable<T>(rows: T[], options?: {
    page?: number;
    pageSize?: number;
}): {
    rows: T[];
    page: number;
    totalPages: number;
    pageSize: number;
    totalRows: number;
    hasPagination: boolean;
};
//# sourceMappingURL=paginate.d.ts.map