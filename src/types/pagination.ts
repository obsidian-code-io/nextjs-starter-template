export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function normalizePagination({
  page = 1,
  pageSize = 10,
}: PaginationParams = {}) {
  const safePage = Number.isFinite(page) && page && page > 0 ? page : 1;
  const clampedSize =
    Number.isFinite(pageSize) && pageSize && pageSize > 0
      ? Math.min(100, pageSize)
      : 10;

  return {
    page: safePage,
    pageSize: clampedSize,
  };
}

export function getQueryParams(
  params: Record<string, string | string[] | undefined>,
  defaults?: { pageSize?: number },
) {
  const rawPage = params.page;
  const rawPageSize = params.pageSize;
  const rawSearch = params.q;

  const page = Math.max(
    1,
    rawPage && typeof rawPage === "string" ? parseInt(rawPage, 10) || 1 : 1,
  );
  const pageSizeDefault = defaults?.pageSize ?? 10;
  const pageSize = Math.min(
    100,
    Math.max(
      5,
      rawPageSize && typeof rawPageSize === "string"
        ? parseInt(rawPageSize, 10) || pageSizeDefault
        : pageSizeDefault,
    ),
  );
  const search =
    rawSearch && typeof rawSearch === "string" ? rawSearch.trim() : "";

  return { page, pageSize, search };
}
