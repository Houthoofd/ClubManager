/**
 * Sentry Middleware
 *
 * Automatic error tracking and performance monitoring for GraphQL resolvers and Express routes.
 * Integrates Sentry with the shared architecture.
 */

import { GraphQLResolveInfo } from "graphql";
import * as Sentry from "@sentry/node";
import {
  captureException,
  captureGraphQLError,
  setSentryUser,
  setSentryContext,
  addSentryBreadcrumb,
  startTransaction,
  sentryConfig,
} from "../config/sentry.config.js";
import { GraphQLContext } from "../types/context.types.js";

/**
 * Sentry middleware for GraphQL resolvers
 * Automatically captures errors and tracks performance
 */
export function withSentry<
  TArgs = any,
  TContext = GraphQLContext,
  TResult = any,
>(
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: any,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!sentryConfig.enabled) {
      return resolver(parent, args, context, info);
    }

    const operationName = info.operation.name?.value || "anonymous";
    const fieldName = info.fieldName;
    const transactionName = `${info.operation.operation}:${operationName}.${fieldName}`;

    // Start transaction for performance monitoring
    const transaction = startTransaction(transactionName, "graphql.resolver");

    // Set user context if available
    if (context.user) {
      setSentryUser({
        id: context.user.id,
        email: context.user.email,
        role: context.user.role,
      });
    }

    // Set custom context
    setSentryContext("graphql", {
      operation: info.operation.operation,
      operationName,
      fieldName,
      parentType: info.parentType.name,
    });

    // Add breadcrumb
    addSentryBreadcrumb(
      `GraphQL ${info.operation.operation}: ${fieldName}`,
      "graphql",
      "info",
      {
        operation: operationName,
        field: fieldName,
      },
    );

    try {
      const result = await resolver(parent, args, context, info);

      if (transaction) {
        transaction.setStatus("ok");
      }

      return result;
    } catch (error: any) {
      // Capture error in Sentry
      captureGraphQLError(
        error,
        `${operationName}.${fieldName}`,
        args,
        context.user
          ? {
              id: context.user.id,
              email: context.user.email,
            }
          : undefined,
      );

      if (transaction) {
        transaction.setStatus("internal_error");
      }

      // Re-throw to let GraphQL handle it
      throw error;
    } finally {
      if (transaction) {
        transaction.finish();
      }
    }
  };
}

/**
 * Sentry middleware for Express request handler
 */
export function sentryRequestHandler() {
  return (Sentry as any).Handlers.requestHandler({
    user: ["id", "email", "role"],
    ip: true,
    request: ["method", "url", "headers", "query"],
  });
}

/**
 * Sentry middleware for Express error handler
 */
export function sentryErrorHandler() {
  return (Sentry as any).Handlers.errorHandler({
    shouldHandleError(error: any) {
      // Capture all errors
      return true;
    },
  });
}

/**
 * Sentry tracing middleware for Express
 */
export function sentryTracingHandler() {
  // Sentry v10: Handlers.tracingHandler() removed, use middleware directly
  return (req: any, res: any, next: any) => next();
}

/**
 * Custom Sentry middleware to enrich context with request data
 */
export function enrichSentryContext() {
  return (req: any, res: any, next: any) => {
    if (!sentryConfig.enabled) {
      return next();
    }

    // Set request context
    setSentryContext("request", {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
      referer: req.headers["referer"],
    });

    // Set user context if authenticated
    if (req.user) {
      setSentryUser({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      });
    }

    next();
  };
}

/**
 * GraphQL error formatter with Sentry integration
 */
export function sentryGraphQLErrorFormatter(
  error: any,
  context?: GraphQLContext,
) {
  if (!sentryConfig.enabled) {
    return error;
  }

  // Don't send expected errors to Sentry (validation, auth, etc.)
  const expectedErrorCodes = [
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "BAD_USER_INPUT",
    "NOT_FOUND",
  ];

  const isExpectedError =
    error.extensions?.code &&
    expectedErrorCodes.includes(error.extensions.code);

  if (!isExpectedError) {
    // Capture unexpected errors
    const originalError = error.originalError || error;

    captureException(originalError, {
      level: "error",
      tags: {
        type: "graphql",
        code: error.extensions?.code || "UNKNOWN",
      },
      extra: {
        path: error.path,
        locations: error.locations,
        extensions: error.extensions,
      },
      user: context?.user
        ? {
            id: String(context.user.id),
            email: context.user.email,
          }
        : undefined,
    });
  }

  return error;
}

/**
 * Wrapper for critical operations that should always be captured
 */
export function withSentryCritical<T>(
  operation: string,
  callback: () => Promise<T>,
): Promise<T> {
  // Use the renamed function from this file
  return withSentryTransactionMiddleware(operation, "critical", async () =>
    callback(),
  );
}

/**
 * Helper to track database queries in Sentry
 */
export function trackDatabaseQuery(query: string, duration: number) {
  if (!sentryConfig.enabled) return;

  addSentryBreadcrumb(
    `Database query: ${query.substring(0, 100)}${query.length > 100 ? "..." : ""}`,
    "query",
    duration > 1000 ? "warning" : "info",
    {
      query: query.substring(0, 500),
      duration: `${duration}ms`,
      slow: duration > 1000,
    },
  );

  // Capture slow queries as performance issues
  if (duration > 2000) {
    captureException(new Error(`Slow query detected: ${duration}ms`), {
      level: "warning",
      tags: {
        type: "slow-query",
        duration: `${duration}ms`,
      },
      extra: {
        query: query.substring(0, 1000),
        duration,
      },
    });
  }
}

/**
 * Helper for tracking external API calls
 */
// Renamed to avoid conflict with sentry.config.ts export
export async function withSentryTransactionMiddleware<T>(
  name: string,
  op: string,
  callback: (transaction?: any) => Promise<T>,
): Promise<T> {
  if (!sentryConfig.enabled) {
    return callback();
  }

  const transaction = startTransaction(name, op);

  try {
    const result = await callback(transaction);
    if (transaction) transaction.setStatus("ok");
    return result;
  } catch (error: any) {
    if (transaction) transaction.setStatus("internal_error");
    captureException(error, {
      level: "error",
      tags: {
        transaction: name,
        operation: op,
      },
    });
    throw error;
  } finally {
    transaction?.finish();
  }
}

/**
 * Helper for tracking authentication events
 */
export function trackAuthEvent(
  event: "login" | "logout" | "register" | "password-reset",
  userId?: string,
  success: boolean = true,
) {
  if (!sentryConfig.enabled) return;

  addSentryBreadcrumb(
    `Auth: ${event} ${success ? "success" : "failed"}`,
    "auth",
    success ? "info" : "warning",
    {
      event,
      userId,
      success,
    },
  );

  // Track failed auth attempts as security events
  if (!success) {
    captureException(new Error(`Auth ${event} failed`), {
      level: "warning",
      tags: {
        type: "auth",
        event,
        success: "false",
      },
      extra: {
        userId,
      },
    });
  }
}

/**
 * Helper for tracking business events
 */
export function trackBusinessEvent(event: string, data?: Record<string, any>) {
  if (!sentryConfig.enabled) return;

  addSentryBreadcrumb(`Business: ${event}`, "business", "info", data);
}

/**
 * Middleware to automatically wrap all GraphQL resolvers
 */
export function applySentryToResolvers(resolvers: any): any {
  if (!sentryConfig.enabled) {
    return resolvers;
  }

  const wrappedResolvers: any = {};

  for (const [typeName, typeResolvers] of Object.entries(resolvers)) {
    wrappedResolvers[typeName] = {};

    for (const [fieldName, resolver] of Object.entries(typeResolvers as any)) {
      if (typeof resolver === "function") {
        wrappedResolvers[typeName][fieldName] = withSentry(resolver as any);
      } else {
        wrappedResolvers[typeName][fieldName] = resolver;
      }
    }
  }

  return wrappedResolvers;
}

/**
 * Express middleware to set transaction name based on route
 */
export function setSentryTransactionName() {
  return (req: any, res: any, next: any) => {
    if (!sentryConfig.enabled) {
      return next();
    }

    const transaction = (Sentry as any)
      .getCurrentHub()
      ?.getScope()
      ?.getTransaction();
    if (transaction && req.route) {
      transaction.setName(`${req.method} ${req.route.path}`);
    }

    next();
  };
}
