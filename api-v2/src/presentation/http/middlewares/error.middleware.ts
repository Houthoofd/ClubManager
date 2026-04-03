import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../core/domain/errors/DomainError.js';

/**
 * Interface pour les erreurs avec code de statut HTTP
 */
interface HttpError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Middleware de gestion centralisée des erreurs
 *
 * Ce middleware capture toutes les erreurs de l'application et :
 * - Transforme les erreurs du domaine en réponses HTTP appropriées
 * - Log les erreurs pour le monitoring
 * - Protège les informations sensibles en production
 * - Retourne des réponses JSON standardisées
 *
 * Ordre des vérifications :
 * 1. Erreurs du domaine (DomainError) → Code HTTP du domaine
 * 2. Erreurs de validation → 400 Bad Request
 * 3. Erreurs d'authentification → 401 Unauthorized
 * 4. Erreurs de permissions → 403 Forbidden
 * 5. Erreurs non trouvées → 404 Not Found
 * 6. Autres erreurs → 500 Internal Server Error
 */
export function errorMiddleware(
  error: Error | DomainError | HttpError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Ne pas traiter si les headers sont déjà envoyés
  if (res.headersSent) {
    return next(error);
  }

  // Déterminer l'environnement
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  // Logger l'erreur (sauf en mode test)
  if (!isTest) {
    console.error('❌ [Error Middleware]', {
      message: error.message,
      name: error.name,
      stack: isDevelopment ? error.stack : undefined,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // 1. Erreurs du domaine (DomainError)
  if (error instanceof DomainError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(isDevelopment && { stack: error.stack }),
    });
    return;
  }

  // 2. Erreurs de validation (peuvent venir de bibliothèques tierces)
  if (
    error.name === 'ValidationError' ||
    error.message.includes('validation') ||
    error.message.includes('invalid')
  ) {
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
      ...(isDevelopment && { stack: error.stack }),
    });
    return;
  }

  // 3. Erreurs d'authentification
  if (
    error.name === 'UnauthorizedError' ||
    error.name === 'JsonWebTokenError' ||
    error.message.includes('token') ||
    error.message.includes('authentication')
  ) {
    res.status(401).json({
      success: false,
      error: 'Authentification requise ou token invalide',
      code: 'UNAUTHORIZED',
      ...(isDevelopment && { details: error.message, stack: error.stack }),
    });
    return;
  }

  // 4. Erreurs de permissions
  if (
    error.message.includes('permission') ||
    error.message.includes('forbidden') ||
    error.message.includes('access denied')
  ) {
    res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      code: 'FORBIDDEN',
      ...(isDevelopment && { details: error.message, stack: error.stack }),
    });
    return;
  }

  // 5. Erreurs "non trouvé"
  if (error.message.includes('not found') || error.message.includes('n\'existe pas')) {
    res.status(404).json({
      success: false,
      error: error.message,
      code: 'NOT_FOUND',
      ...(isDevelopment && { stack: error.stack }),
    });
    return;
  }

  // 6. Erreurs avec code de statut personnalisé
  const httpError = error as HttpError;
  if (httpError.statusCode) {
    res.status(httpError.statusCode).json({
      success: false,
      error: error.message,
      code: httpError.code || 'ERROR',
      ...(isDevelopment && { stack: error.stack }),
    });
    return;
  }

  // 7. Erreurs de base de données
  if (
    error.message.includes('ER_') || // MySQL error codes
    error.message.includes('duplicate key') ||
    error.message.includes('foreign key')
  ) {
    // Log l'erreur complète côté serveur
    console.error('❌ [Database Error]', error);

    // Ne pas exposer les détails de la DB en production
    res.status(500).json({
      success: false,
      error: isDevelopment
        ? error.message
        : 'Erreur de base de données',
      code: 'DATABASE_ERROR',
      ...(isDevelopment && { stack: error.stack }),
    });
    return;
  }

  // 8. Erreurs inattendues (500)
  // En production, ne jamais exposer les détails des erreurs internes
  res.status(500).json({
    success: false,
    error: isDevelopment
      ? error.message
      : 'Une erreur interne est survenue',
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && { stack: error.stack }),
  });
}

/**
 * Middleware pour les routes non trouvées (404)
 * À placer APRÈS toutes les routes
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route non trouvée: ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

/**
 * Wrapper pour les fonctions async dans les controllers
 * Évite d'avoir à mettre try/catch partout
 *
 * Utilisation:
 * router.get('/users/:id', asyncHandler(userController.getUserById.bind(userController)));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Gestion des erreurs non capturées (fallback)
 */
export function setupUncaughtErrorHandlers(): void {
  // Erreurs non capturées
  process.on('uncaughtException', (error: Error) => {
    console.error('❌ [Uncaught Exception]', error);
    console.error('Stack:', error.stack);
    // En production, on pourrait envoyer l'erreur à un service de monitoring
    // puis arrêter proprement l'application
    process.exit(1);
  });

  // Promesses rejetées non gérées
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('❌ [Unhandled Rejection]', reason);
    console.error('Promise:', promise);
    // En production, on pourrait envoyer l'erreur à un service de monitoring
  });
}
