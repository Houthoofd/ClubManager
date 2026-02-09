/**
 * Common Shared Types
 *
 * Reusable type definitions used across the application.
 * These types provide consistency and type safety.
 */

/**
 * Pagination input for queries
 */
export interface PaginationInput {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Pagination result metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort input
 */
export interface SortInput {
  field: string;
  order?: SortOrder;
}

/**
 * Search input
 */
export interface SearchInput {
  query: string;
  fields?: string[];
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Generic filter input
 */
export interface FilterInput {
  [key: string]: any;
}

/**
 * Standard API response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stackTrace?: string;
}

/**
 * Success/Error result type
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * ID type (UUID string)
 */
export type ID = string;

/**
 * Timestamp fields
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft delete fields
 */
export interface SoftDelete {
  deletedAt?: Date | null;
  isDeleted: boolean;
}

/**
 * Entity with timestamps
 */
export interface TimestampedEntity extends Timestamps {
  id: ID;
}

/**
 * Entity with soft delete
 */
export interface SoftDeletableEntity extends TimestampedEntity, SoftDelete {}

/**
 * User role enum
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

/**
 * Language codes
 */
export type LanguageCode = 'fr' | 'en' | 'nl';

/**
 * Currency codes
 */
export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

/**
 * File upload info
 */
export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  size: number;
  url?: string;
}

/**
 * Address structure
 */
export interface Address {
  street: string;
  number: string;
  box?: string;
  postalCode: string;
  city: string;
  country: string;
}

/**
 * Contact information
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
}

/**
 * Geo coordinates
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Time range
 */
export interface TimeRange {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

/**
 * Date and time range
 */
export interface DateTimeRange {
  startDateTime: Date;
  endDateTime: Date;
}

/**
 * Status type
 */
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Visibility enum
 */
export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
}

/**
 * Day of week
 */
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

/**
 * Notification type
 */
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

/**
 * Notification
 */
export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Audit metadata
 */
export interface AuditMetadata {
  createdBy?: ID;
  updatedBy?: ID;
  deletedBy?: ID;
}

/**
 * Price structure
 */
export interface Price {
  amount: number;
  currency: CurrencyCode;
  formatted?: string;
}

/**
 * Statistics
 */
export interface Statistics {
  total: number;
  active: number;
  inactive: number;
  [key: string]: number;
}

/**
 * Key-value pair
 */
export interface KeyValuePair<T = any> {
  key: string;
  value: T;
}

/**
 * Select option
 */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/**
 * Validation error field
 */
export interface ValidationErrorField {
  field: string;
  message: string;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ id: ID; error: string }>;
}

/**
 * Analytics data point
 */
export interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

/**
 * Chart data
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

/**
 * Environment type
 */
export type Environment = 'development' | 'production' | 'test' | 'staging';

/**
 * Log level
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * HTTP method
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Deep partial (makes all nested properties optional)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly (makes all nested properties readonly)
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Async function type
 */
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

/**
 * Callback function type
 */
export type Callback<T = void> = (error?: Error | null, result?: T) => void;

/**
 * Event handler type
 */
export type EventHandler<T = any> = (event: T) => void | Promise<void>;

/**
 * Middleware function type
 */
export type Middleware<TContext = any, TResult = any> = (
  context: TContext,
  next: () => Promise<TResult>
) => Promise<TResult>;

/**
 * Constructor type
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Maybe type (nullable or undefined)
 */
export type Maybe<T> = T | null | undefined;

/**
 * JSON value types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Extract keys of a specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Readonly array
 */
export type ReadonlyArray<T> = readonly T[];

/**
 * Non-empty array
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Tuple to union
 */
export type TupleToUnion<T extends readonly any[]> = T[number];

/**
 * Union to intersection
 */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Awaited type (for async operations)
 */
export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
