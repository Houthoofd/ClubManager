/**
 * Shared Types Index
 *
 * Re-exports types from the centralized @clubmanager/types package.
 * This file maintains backward compatibility while using the shared package.
 *
 * Import types like: import { GraphQLContext, PaginationInput } from '@/shared/types'
 */

// Re-export from centralized package
export type {
  // GraphQL Context Types
  GraphQLContext,
  AuthenticatedContext,
  AdminContext,
  OwnerContext,
  ContextFactory,
  ContextFactoryParams,
  Resolver,
  ResolverMap,
  Resolvers,

  // Common Types
  PaginationInput,
  PaginationMeta,
  PaginatedResponse,
  SortOrder,
  SortInput,
  SearchInput,
  DateRangeFilter,
  FilterInput,
  ApiResponse,
  ApiError,
  Result,
  ID,
  Timestamps,
  SoftDelete,
  TimestampedEntity,
  SoftDeletableEntity,

  // Utility Types
  Nullable,
  Maybe,
  DeepPartial,

  // Service Types
  RateLimitService,
  AuditLogService,
  SessionService,
} from "@clubmanager/types";

// Re-export type guards
export {
  isAuthenticatedContext,
  isAdminContext,
  isOwnerContext,
} from "@clubmanager/types";
