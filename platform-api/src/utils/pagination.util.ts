/**
 * Pagination Utilities
 * Helper functions for pagination and query parameters
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const MIN_LIMIT = 1;

/**
 * Extract and validate pagination parameters from query
 */
export function getPaginationParams(query: any): PaginationParams {
  let page = parseInt(query.page, 10) || DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;

  // Validate page
  if (page < 1) {
    page = DEFAULT_PAGE;
  }

  // Validate limit
  if (limit < MIN_LIMIT) {
    limit = MIN_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginationResult<T> {
  const pagination = createPaginationMeta(page, limit, total);

  return {
    data,
    pagination
  };
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Calculate skip value from page and limit
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Check if page is valid
 */
export function isValidPage(page: number, totalPages: number): boolean {
  return page >= 1 && page <= totalPages;
}

/**
 * Get next page number
 */
export function getNextPage(page: number, totalPages: number): number | null {
  return page < totalPages ? page + 1 : null;
}

/**
 * Get previous page number
 */
export function getPrevPage(page: number): number | null {
  return page > 1 ? page - 1 : null;
}

/**
 * Get page range for pagination UI
 */
export function getPageRange(
  currentPage: number,
  totalPages: number,
  maxPages: number = 5
): number[] {
  if (totalPages <= maxPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxPages / 2);
  let start = currentPage - half;
  let end = currentPage + half;

  if (start < 1) {
    start = 1;
    end = maxPages;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxPages + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Create pagination links (for HATEOAS APIs)
 */
export function createPaginationLinks(
  baseUrl: string,
  page: number,
  limit: number,
  totalPages: number
): {
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
} {
  const createUrl = (p: number) => `${baseUrl}?page=${p}&limit=${limit}`;

  return {
    first: createUrl(1),
    prev: page > 1 ? createUrl(page - 1) : null,
    next: page < totalPages ? createUrl(page + 1) : null,
    last: createUrl(totalPages)
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(page: number, limit: number): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Number.isInteger(page) || page < 1) {
    errors.push('Page must be a positive integer');
  }

  if (!Number.isInteger(limit) || limit < MIN_LIMIT) {
    errors.push(`Limit must be at least ${MIN_LIMIT}`);
  }

  if (limit > MAX_LIMIT) {
    errors.push(`Limit cannot exceed ${MAX_LIMIT}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get items for current page from array
 */
export function paginateArray<T>(
  items: T[],
  page: number,
  limit: number
): PaginationResult<T> {
  const total = items.length;
  const skip = calculateSkip(page, limit);
  const data = items.slice(skip, skip + limit);

  return createPaginatedResponse(data, page, limit, total);
}

/**
 * Create cursor-based pagination params
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

/**
 * Create cursor-based pagination result
 */
export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

/**
 * Encode cursor (base64)
 */
export function encodeCursor(id: string | number): string {
  return Buffer.from(String(id)).toString('base64');
}

/**
 * Decode cursor (base64)
 */
export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch (error) {
    throw new Error('Invalid cursor');
  }
}

/**
 * Get offset-limit from page-limit
 */
export function offsetLimitFromPage(page: number, limit: number): { offset: number; limit: number } {
  return {
    offset: calculateSkip(page, limit),
    limit
  };
}
