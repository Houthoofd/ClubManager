/**
 * Core API response types
 * Generic response types for database operations
 */

export interface InsertResult {
  insertId: number;
  affectedRows: number;
}

export interface UpdateResult {
  affectedRows: number;
  changedRows: number;
}

export interface DeleteResult {
  affectedRows: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
