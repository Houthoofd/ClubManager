import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "../utils/errors.util.js";

/**
 * Interface pour les erreurs standardisées
 */
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: any;
  stack?: string;
}

/**
 * Middleware principal de gestion des erreurs
 * Doit être le dernier middleware ajouté à l'app
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log l'erreur
  console.error("Error caught by error handler:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Erreur personnalisée (AppError)
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    if (err.details) {
      response.details = err.details;
    }

    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Erreurs Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, req, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      message: "Invalid data provided",
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: req.path,
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  // Erreurs Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      message: "Request validation failed",
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: req.path,
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      })),
    });
  }

  // Erreurs JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "UnauthorizedError",
      message: "Invalid authentication token",
      statusCode: 401,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "UnauthorizedError",
      message: "Authentication token has expired",
      statusCode: 401,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Erreurs de syntaxe JSON
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "SyntaxError",
      message: "Invalid JSON in request body",
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Erreur générique 500
  const response: ErrorResponse = {
    success: false,
    error: "InternalServerError",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(500).json(response);
};

/**
 * Gestion spécifique des erreurs Prisma
 */
const handlePrismaError = (
  err: Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
) => {
  const response: ErrorResponse = {
    success: false,
    error: "DatabaseError",
    message: "Database operation failed",
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  switch (err.code) {
    // Contrainte unique violée
    case "P2002":
      response.statusCode = 409;
      response.error = "ConflictError";
      response.message = "A record with this value already exists";
      response.details = {
        fields: (err.meta?.target as string[]) || [],
      };
      break;

    // Enregistrement non trouvé
    case "P2025":
      response.statusCode = 404;
      response.error = "NotFoundError";
      response.message = "Record not found";
      response.details = {
        cause: err.meta?.cause,
      };
      break;

    // Clé étrangère violée
    case "P2003":
      response.statusCode = 400;
      response.error = "ValidationError";
      response.message = "Foreign key constraint failed";
      response.details = {
        field: err.meta?.field_name,
      };
      break;

    // Contrainte violée
    case "P2004":
      response.statusCode = 400;
      response.error = "ValidationError";
      response.message = "Constraint violation";
      break;

    // Valeur invalide pour le type de champ
    case "P2006":
    case "P2007":
      response.statusCode = 400;
      response.error = "ValidationError";
      response.message = "Invalid value provided for field";
      break;

    // Timeout de requête
    case "P2024":
      response.statusCode = 504;
      response.error = "TimeoutError";
      response.message = "Database operation timed out";
      break;

    // Connexion perdue
    case "P1001":
    case "P1002":
      response.statusCode = 503;
      response.error = "ServiceUnavailableError";
      response.message = "Database connection failed";
      break;

    // Trop de connexions
    case "P1008":
      response.statusCode = 503;
      response.error = "ServiceUnavailableError";
      response.message = "Database connection pool exhausted";
      break;

    default:
      response.statusCode = 500;
      response.error = "DatabaseError";
      response.message = "An unexpected database error occurred";
      if (process.env.NODE_ENV === "development") {
        response.details = {
          code: err.code,
          meta: err.meta,
        };
      }
  }

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  return res.status(response.statusCode).json(response);
};

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(404).json({
    success: false,
    error: "NotFoundError",
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

/**
 * Wrapper async pour éviter les try/catch dans les routes
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware pour gérer les erreurs non capturées
 */
export const setupGlobalErrorHandlers = () => {
  // Gérer les promesses non capturées
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Ne pas faire crash l'app, mais logger l'erreur
    // En production, vous devriez envoyer cette erreur à un service de monitoring
  });

  // Gérer les exceptions non capturées
  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught Exception:", error);
    // En production, vous devriez gracefully shutdown l'app
    if (process.env.NODE_ENV === "production") {
      console.error("Shutting down due to uncaught exception");
      process.exit(1);
    }
  });

  // Gérer les signaux de terminaison
  const gracefulShutdown = (signal: string) => {
    console.log(`\n${signal} signal received: closing HTTP server`);
    // Ici vous devriez fermer les connexions DB, Redis, etc.
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

/**
 * Middleware pour logger les erreurs vers un service externe
 * (Sentry, DataDog, etc.)
 */
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log vers un service externe en production
  if (process.env.NODE_ENV === "production") {
    // Exemple: Sentry.captureException(err, { req });
    // Ou: logger.error(err, { req, res });
  }

  // Toujours passer au prochain middleware
  next(err);
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  setupGlobalErrorHandlers,
  errorLogger,
};
