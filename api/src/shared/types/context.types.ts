/**
 * GraphQL Context Types
 *
 * Type definitions for the GraphQL context object.
 * Ensures type safety across all resolvers.
 */

import { PrismaClient, User } from '@prisma/client';
import { Request, Response } from 'express';
import { RateLimitService } from '../services/rate-limit.service';
import { AuditLogService } from '../services/audit-log.service';
import { SessionService } from '../services/session.service';

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
  rateLimitService: RateLimitService;
  auditLogService: AuditLogService;
  sessionService: SessionService;

  // Authentication
  user: User | null;
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
  user: User; // User is guaranteed to exist
  token: string;
}

/**
 * Admin Context
 * Use when requireAdmin middleware is applied
 */
export interface AdminContext extends AuthenticatedContext {
  user: User & { role: 'ADMIN' };
}

/**
 * Context with owner verification
 * Use when requireOwner middleware is applied
 */
export interface OwnerContext extends AuthenticatedContext {
  isOwner: boolean;
}

/**
 * Type guard to check if context is authenticated
 */
export function isAuthenticatedContext(
  context: GraphQLContext
): context is AuthenticatedContext {
  return context.user !== null && context.user !== undefined;
}

/**
 * Type guard to check if user is admin
 */
export function isAdminContext(
  context: GraphQLContext
): context is AdminContext {
  return isAuthenticatedContext(context) && context.user.role === 'ADMIN';
}

/**
 * Context factory type
 */
export type ContextFactory = (params: {
  req: Request;
  res: Response;
}) => GraphQLContext | Promise<GraphQLContext>;
