export interface PaginationRequest {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationWindow {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationWindow(
  request: PaginationRequest = {},
  defaultLimit = 20,
  maximumLimit = 100
): PaginationWindow {
  const page = Math.max(1, request.page ?? 1);
  const limit = Math.min(maximumLimit, Math.max(1, request.limit ?? defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
