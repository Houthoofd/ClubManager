/**
 * GraphQL Infrastructure Types
 *
 * Type definitions for GraphQL context, resolvers, and server infrastructure.
 * Ensures type safety across all GraphQL operations.
 */

import type { Request, Response } from "express";

// PrismaClient type - optional import
type PrismaClient = any;

// ============================================================================
// BASE USER TYPE (from Prisma)
// ============================================================================

/**
 * Base user type from database
 * Note: Import from @prisma/client when available
 */
export interface BaseUser {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  status_id: number;
  date_naissance?: Date | null;
  telephone?: string | null;
  adresse?: string | null;
  created_at: Date;
  updated_at: Date;
  [key: string]: any;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface RateLimitService {
  checkLimit(key: string): Promise<boolean>;
  incrementCounter(key: string): Promise<void>;
  getRemainingRequests(key: string): Promise<number>;
}

export interface AuditLogService {
  log(params: {
    action: string;
    userId?: number;
    resource?: string;
    resourceId?: number | string;
    metadata?: Record<string, any>;
  }): Promise<void>;
}

export interface SessionService {
  create(userId: number): Promise<string>;
  validate(sessionId: string): Promise<boolean>;
  destroy(sessionId: string): Promise<void>;
  getUserId(sessionId: string): Promise<number | null>;
}

// ============================================================================
// GRAPHQL CONTEXT TYPES
// ============================================================================

/**
 * Base GraphQL Context
 * Available in all resolvers as the 3rd argument
 */
export interface GraphQLContext {
  // HTTP Request/Response
  req: Request;
  res: Response;

  // Database
  prisma: PrismaClient;

  // Services
  rateLimitService?: RateLimitService;
  auditLogService?: AuditLogService;
  sessionService?: SessionService;

  // Authentication
  user: BaseUser | null;
  token?: string;
  sessionId?: string;

  // Request metadata
  ip: string;
  userAgent: string;

  // Custom properties (extensible)
  [key: string]: any;
}

/**
 * Authenticated Context
 * Use when requireAuth middleware is applied
 */
export interface AuthenticatedContext extends GraphQLContext {
  user: BaseUser; // User is guaranteed to exist
  token: string;
}

/**
 * Admin Context
 * Use when requireAdmin middleware is applied
 */
export interface AdminContext extends AuthenticatedContext {
  // Admin is determined by status_id (1 = ADMIN)
  user: BaseUser & { status_id: 1 };
}

/**
 * Context with owner verification
 * Use when requireOwner middleware is applied
 */
export interface OwnerContext extends AuthenticatedContext {
  isOwner: boolean;
  resourceId?: number | string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if context is authenticated
 */
export function isAuthenticatedContext(
  context: GraphQLContext,
): context is AuthenticatedContext {
  return context.user !== null && context.user !== undefined && !!context.token;
}

/**
 * Type guard to check if user is admin
 */
export function isAdminContext(
  context: GraphQLContext,
): context is AdminContext {
  return isAuthenticatedContext(context) && context.user.status_id === 1;
}

/**
 * Type guard to check if user is owner
 */
export function isOwnerContext(
  context: GraphQLContext,
): context is OwnerContext {
  return isAuthenticatedContext(context) && "isOwner" in context;
}

// ============================================================================
// CONTEXT FACTORY TYPES
// ============================================================================

/**
 * Parameters for creating GraphQL context
 */
export interface ContextFactoryParams {
  req: Request;
  res: Response;
}

/**
 * Context factory function type
 */
export type ContextFactory = (
  params: ContextFactoryParams,
) => GraphQLContext | Promise<GraphQLContext>;

// ============================================================================
// RESOLVER TYPES
// ============================================================================

/**
 * GraphQL resolver parent type
 */
export type ResolverParent = any;

/**
 * GraphQL resolver arguments
 */
export type ResolverArgs = Record<string, any>;

/**
 * GraphQL resolver info
 */
export interface ResolverInfo {
  fieldName: string;
  fieldNodes: any[];
  returnType: any;
  parentType: any;
  path: any;
  schema: any;
  fragments: Record<string, any>;
  rootValue: any;
  operation: any;
  variableValues: Record<string, any>;
}

/**
 * GraphQL resolver function type
 */
export type Resolver<
  TResult = any,
  TParent = any,
  TContext = GraphQLContext,
  TArgs = any,
> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: ResolverInfo,
) => Promise<TResult> | TResult;

/**
 * Resolver map for a type
 */
export type ResolverMap<TSource = any, TContext = GraphQLContext> = {
  [field: string]: Resolver<any, TSource, TContext, any>;
};

/**
 * Complete resolvers map
 */
export interface Resolvers<TContext = GraphQLContext> {
  Query?: ResolverMap<any, TContext>;
  Mutation?: ResolverMap<any, TContext>;
  Subscription?: ResolverMap<any, TContext>;
  [typeName: string]: ResolverMap<any, TContext> | undefined;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

/**
 * Subscription resolver function
 */
export interface SubscriptionResolver<
  TResult = any,
  TParent = any,
  TContext = GraphQLContext,
  TArgs = any,
> {
  subscribe: Resolver<AsyncIterator<TResult>, TParent, TContext, TArgs>;
  resolve?: Resolver<TResult, TResult, TContext, TArgs>;
}

/**
 * Subscription filter function
 */
export type SubscriptionFilterFn<
  TPayload = any,
  TVariables = any,
  TContext = GraphQLContext,
> = (
  payload: TPayload,
  variables: TVariables,
  context: TContext,
) => boolean | Promise<boolean>;

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================

/**
 * GraphQL middleware function
 */
export type GraphQLMiddleware<TContext = GraphQLContext> = (
  resolve: Resolver<any, any, TContext>,
  parent: any,
  args: any,
  context: TContext,
  info: ResolverInfo,
) => Promise<any>;

/**
 * Field middleware config
 */
export interface FieldMiddlewareConfig {
  field: string;
  middleware: GraphQLMiddleware[];
}

// ============================================================================
// DIRECTIVE TYPES
// ============================================================================

/**
 * Custom directive visitor
 */
export interface DirectiveVisitor {
  visitFieldDefinition?(field: any): void;
  visitArgumentDefinition?(argument: any): void;
  visitInputFieldDefinition?(field: any): void;
  visitEnumValue?(value: any): void;
  visitObject?(object: any): void;
  visitInputObject?(object: any): void;
  visitScalar?(scalar: any): void;
  visitUnion?(union: any): void;
  visitInterface?(iface: any): void;
  visitSchema?(schema: any): void;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * GraphQL error extension
 */
export interface GraphQLErrorExtension {
  code: string;
  statusCode?: number;
  timestamp?: string;
  path?: string[];
  [key: string]: any;
}

/**
 * Custom GraphQL error options
 */
export interface CustomGraphQLErrorOptions {
  message: string;
  code: string;
  statusCode?: number;
  extensions?: Record<string, any>;
}

// ============================================================================
// SCHEMA TYPES
// ============================================================================

/**
 * Schema configuration
 */
export interface SchemaConfig {
  typeDefs: string | string[];
  resolvers: Resolvers;
  directives?: Record<string, DirectiveVisitor>;
  schemaDirectives?: Record<string, any>;
}

/**
 * Schema module
 */
export interface SchemaModule {
  typeDefs: string;
  resolvers: Resolvers;
}

// ============================================================================
// SERVER TYPES
// ============================================================================

/**
 * GraphQL server configuration
 */
export interface GraphQLServerConfig {
  schema: any;
  context: ContextFactory;
  formatError?: (error: any) => any;
  formatResponse?: (response: any, context: any) => any;
  plugins?: any[];
  introspection?: boolean;
  playground?: boolean;
  debug?: boolean;
}

/**
 * Server health status
 */
export interface GraphQLServerHealth {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  timestamp: Date;
  database: "connected" | "disconnected";
  cache?: "connected" | "disconnected";
}

// ============================================================================
// BATCH LOADING TYPES
// ============================================================================

/**
 * DataLoader batch load function
 */
export type BatchLoadFn<K = any, V = any> = (
  keys: readonly K[],
) => Promise<Array<V | Error>>;

/**
 * DataLoader options
 */
export interface DataLoaderOptions<K = any, V = any> {
  batch?: boolean;
  maxBatchSize?: number;
  cache?: boolean;
  cacheKeyFn?: (key: K) => any;
  cacheMap?: Map<any, Promise<V>>;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Connection edge (Relay-style)
 */
export interface Edge<T> {
  cursor: string;
  node: T;
}

/**
 * Page info (Relay-style)
 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

/**
 * Connection (Relay-style)
 */
export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount?: number;
}

/**
 * Connection arguments
 */
export interface ConnectionArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Resolver execution metrics
 */
export interface ResolverMetrics {
  fieldName: string;
  typeName: string;
  duration: number;
  timestamp: Date;
  userId?: number;
  error?: string;
}

/**
 * Query complexity info
 */
export interface QueryComplexity {
  complexity: number;
  maxComplexity: number;
  depth: number;
  maxDepth: number;
}
