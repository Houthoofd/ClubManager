/**
 * Common/Shared Types
 *
 * Reusable interfaces, types, and utilities used across the entire ClubManager application.
 * This file contains generic types that don't fit into specific categories.
 */

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationInput {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CursorPaginationInput {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginationMeta {
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

// ============================================================================
// SORTING TYPES
// ============================================================================

export type SortOrder = 'asc' | 'desc' | 'ASC' | 'DESC';

export interface SortInput {
  field: string;
  order: SortOrder;
}

export interface MultiSortInput {
  sorts: SortInput[];
}

// ============================================================================
// FILTERING TYPES
// ============================================================================

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'between'
  | 'isNull'
  | 'isNotNull';

export interface FilterInput {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface MultiFilterInput {
  filters: FilterInput[];
  logic?: 'AND' | 'OR';
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export interface ErrorResponseData {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponseData;

export interface OperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface MutationResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface BatchOperationResult<T = any> {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: Array<{
    id: string | number;
    success: boolean;
    data?: T;
    error?: string;
  }>;
}

// ============================================================================
// QUERY RESULT TYPES (Legacy compatibility)
// ============================================================================

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

export interface VerifyResult {
  isFind: boolean;
  message: string;
}

export interface VerifyResultWithData<T = any> extends VerifyResult {
  data: T;
}

export interface Book<T = any> {
  isBooked: boolean;
  message: string;
  data: T;
}

export type BookResult<T = any> = Book<T> & VerifyResult;

export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
}

// ============================================================================
// DATE RANGE TYPES
// ============================================================================

export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

export interface OptionalDateRange {
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface TimestampRange {
  start: number;
  end: number;
}

// ============================================================================
// ID TYPES
// ============================================================================

export type ID = string | number;

export type StringID = string;

export type NumericID = number;

export interface HasId {
  id: ID;
}

export interface HasNumericId {
  id: number;
}

export interface HasStringId {
  id: string;
}

// ============================================================================
// TIMESTAMP TYPES
// ============================================================================

export interface Timestamps {
  created_at: Date;
  updated_at: Date;
}

export interface OptionalTimestamps {
  created_at?: Date;
  updated_at?: Date;
}

export interface SoftDelete extends Timestamps {
  deleted_at?: Date | null;
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  size: number;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface MultiFileUploadResult {
  success: boolean;
  files: Array<{
    filename: string;
    url: string;
    key: string;
  }>;
  errors?: string[];
}

// ============================================================================
// METADATA TYPES
// ============================================================================

export type Metadata = Record<string, any>;

export interface WithMetadata {
  metadata?: Metadata;
}

export interface JsonField {
  [key: string]: any;
}

// ============================================================================
// STATUS TYPES
// ============================================================================

export type Status = 'active' | 'inactive' | 'pending' | 'deleted' | 'archived';

export interface HasStatus {
  status: Status;
}

export interface HasActive {
  active: boolean;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchInput {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  took?: number;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditFields {
  created_by?: number | string;
  updated_by?: number | string;
  created_at: Date;
  updated_at?: Date;
}

export interface FullAuditFields extends AuditFields {
  deleted_by?: number | string;
  deleted_at?: Date | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

// ============================================================================
// LOCALE TYPES
// ============================================================================

export type Locale = 'fr' | 'en' | 'nl' | 'de';

export interface LocalizedString {
  [locale: string]: string;
}

export interface WithLocale {
  locale?: Locale;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: ValidationError[];
}

// ============================================================================
// ENUM HELPER TYPES
// ============================================================================

export type EnumValues<T extends Record<string, any>> = T[keyof T];

export type StringEnum<T> = T extends string ? T : never;

export type NumericEnum<T> = T extends number ? T : never;

// ============================================================================
// CONTACT INFORMATION TYPES
// ============================================================================

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

export interface FullAddress {
  street: string;
  street2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface CountResult {
  count: number;
}

export interface AggregateResult {
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  count: number;
}

export interface GroupedAggregateResult {
  groupBy: string | number;
  aggregates: AggregateResult;
}

// ============================================================================
// ASYNC OPERATION TYPES
// ============================================================================

export interface AsyncOperationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface JobResult<T = any> {
  id: string;
  status: 'completed' | 'failed';
  data?: T;
  error?: string;
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: Record<
    string,
    {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    }
  >;
}

// ============================================================================
// VERSIONING TYPES
// ============================================================================

export interface Versioned {
  version: number;
}

export interface VersionedEntity<T> extends Versioned {
  data: T;
  created_at: Date;
  created_by: string | number;
}

// ============================================================================
// ARCHIVE TYPES
// ============================================================================

export interface Archivable {
  archived: boolean;
  archived_at?: Date | null;
  archived_by?: number | string;
}

// ============================================================================
// NOTIFICATION TYPES (Basic)
// ============================================================================

export interface NotificationPayload {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  data?: Record<string, any>;
}

// ============================================================================
// EXPORT ALL FROM query.ts FOR BACKWARD COMPATIBILITY
// ============================================================================

export type { CoursApiResponse, UtilisateurApiResponse } from './query.js';
