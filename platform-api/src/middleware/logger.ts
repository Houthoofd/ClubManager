import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface pour les logs de requête
 */
interface RequestLog {
  requestId: string;
  timestamp: string;
  method: string;
  url: string;
  path: string;
  query: any;
  statusCode?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  userId?: number;
  tenantId?: string;
  error?: any;
  size?: {
    request: number;
    response: number;
  };
}

/**
 * Options pour le logger
 */
interface LoggerOptions {
  skip?: (req: Request, res: Response) => boolean;
  includeBody?: boolean;
  includeQuery?: boolean;
  includeHeaders?: boolean;
  sensitiveHeaders?: string[];
  sensitiveFields?: string[];
  logLevel?: 'minimal' | 'standard' | 'verbose';
}

/**
 * Middleware principal de logging des requêtes
 * Capture les informations de requête/réponse et mesure la performance
 */
export const requestLogger = (options?: LoggerOptions) => {
  const {
    skip,
    includeBody = false,
    includeQuery = true,
    includeHeaders = false,
    sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'],
    sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'],
    logLevel = 'standard',
  } = options || {};

  return (req: Request, res: Response, next: NextFunction) => {
    // Vérifier si on doit skip cette requête
    if (skip && skip(req, res)) {
      return next();
    }

    // Générer un ID unique pour la requête
    const requestId = uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Timestamp de début
    const startTime = Date.now();
    const startHrTime = process.hrtime();

    // Préparer le log de requête
    const logData: RequestLog = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      path: req.path,
      query: includeQuery ? sanitizeObject(req.query, sensitiveFields) : {},
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      tenantId: req.tenant?.tenantId,
    };

    // Ajouter le body si demandé (attention en production)
    if (includeBody && req.body) {
      (logData as any).body = sanitizeObject(req.body, sensitiveFields);
    }

    // Ajouter les headers si demandé
    if (includeHeaders) {
      (logData as any).headers = sanitizeHeaders(req.headers, sensitiveHeaders);
    }

    // Capturer la taille de la requête
    const requestSize = parseInt(req.get('content-length') || '0');
    logData.size = { request: requestSize, response: 0 };

    // Log de la requête entrante
    if (logLevel === 'verbose') {
      console.log(`→ [${requestId}] ${req.method} ${req.path}`, {
        query: logData.query,
        userId: logData.userId,
        tenantId: logData.tenantId,
        ip: logData.ip,
      });
    }

    // Intercepter la réponse pour logger la sortie
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override res.json
    res.json = function (data: any) {
      captureResponse(data);
      return originalJson(data);
    };

    // Override res.send
    res.send = function (data: any) {
      captureResponse(data);
      return originalSend(data);
    };

    // Fonction pour capturer et logger la réponse
    const captureResponse = (data: any) => {
      const duration = Date.now() - startTime;
      const hrDuration = process.hrtime(startHrTime);
      const durationMs = hrDuration[0] * 1000 + hrDuration[1] / 1000000;

      logData.statusCode = res.statusCode;
      logData.duration = Math.round(durationMs * 100) / 100; // Arrondir à 2 décimales

      // Estimer la taille de la réponse
      if (data) {
        const responseSize = typeof data === 'string'
          ? Buffer.byteLength(data)
          : Buffer.byteLength(JSON.stringify(data));
        logData.size!.response = responseSize;
      }

      // Déterminer le niveau de log selon le status code
      const isError = res.statusCode >= 400;
      const isServerError = res.statusCode >= 500;

      // Format du log selon le niveau
      if (logLevel === 'minimal') {
        const logMessage = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
        if (isServerError) {
          console.error(logMessage);
        } else if (isError) {
          console.warn(logMessage);
        } else {
          console.log(logMessage);
        }
      } else {
        const emoji = getStatusEmoji(res.statusCode);
        const logMessage = `${emoji} [${requestId}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`;

        const logDetails: any = {
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          size: `${formatBytes(logData.size!.request)} → ${formatBytes(logData.size!.response)}`,
        };

        if (logData.userId) logDetails.userId = logData.userId;
        if (logData.tenantId) logDetails.tenantId = logData.tenantId;
        if (logLevel === 'verbose') {
          logDetails.query = logData.query;
          logDetails.ip = logData.ip;
          logDetails.userAgent = logData.userAgent;
        }

        if (isServerError) {
          console.error(logMessage, logDetails);
          if (logLevel === 'verbose' && data?.error) {
            console.error('Error details:', data);
          }
        } else if (isError) {
          console.warn(logMessage, logDetails);
        } else {
          console.log(logMessage, logDetails);
        }
      }

      // Logger les requêtes lentes
      if (duration > 1000) {
        console.warn(`⚠️  Slow request detected [${requestId}]:`, {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          userId: logData.userId,
          tenantId: logData.tenantId,
        });
      }

      // Stocker le log complet pour audit si nécessaire
      if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
        // Ici on pourrait envoyer à un service de logging externe
        // ou sauvegarder dans une base de données
        storeRequestLog(logData);
      }

      // Restaurer les méthodes originales pour éviter les double logs
      res.json = originalJson;
      res.send = originalSend;
    };

    // Gérer les erreurs de stream
    res.on('finish', () => {
      if (!logData.statusCode) {
        captureResponse(null);
      }
    });

    res.on('close', () => {
      if (!res.writableEnded && !logData.statusCode) {
        logData.statusCode = 499; // Client Closed Request
        const duration = Date.now() - startTime;
        console.warn(`⚠️  [${requestId}] Client closed connection after ${duration}ms`);
      }
    });

    next();
  };
};

/**
 * Middleware de logging des performances
 */
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Ajouter des métriques de performance à res.locals
  res.locals.perfMetrics = {
    startTime,
    markers: [] as Array<{ name: string; time: number; duration: number }>,
  };

  // Fonction helper pour marquer un point de performance
  (req as any).markPerformance = (name: string) => {
    const currentTime = Date.now();
    res.locals.perfMetrics.markers.push({
      name,
      time: currentTime,
      duration: currentTime - startTime,
    });
  };

  res.on('finish', () => {
    const totalDuration = Date.now() - startTime;
    if (res.locals.perfMetrics.markers.length > 0) {
      res.setHeader('Server-Timing',
        res.locals.perfMetrics.markers
          .map((m: any) => `${m.name};dur=${m.duration}`)
          .join(', ')
      );
    }
    res.setHeader('X-Response-Time', `${totalDuration}ms`);
  });

  next();
};

/**
 * Middleware pour logger les accès à des ressources sensibles
 */
export const sensitiveResourceLogger = (resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`🔒 Sensitive resource accessed: ${resourceType}`, {
          requestId: req.requestId,
          userId: req.user?.id,
          tenantId: req.tenant?.tenantId,
          method: req.method,
          path: req.path,
          resourceId: req.params.id || data?.id,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware pour logger les modifications de données
 */
export const dataChangeLogger = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`📝 Data modified:`, {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          resourceId: req.params.id || data?.id,
          userId: req.user?.id,
          tenantId: req.tenant?.tenantId,
          timestamp: new Date().toISOString(),
        });
      }
      return originalJson(data);
    };
  }

  next();
};

/**
 * Sanitize un objet en masquant les champs sensibles
 */
const sanitizeObject = (obj: any, sensitiveFields: string[]): any => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeObject(obj[key], sensitiveFields);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
};

/**
 * Sanitize les headers HTTP
 */
const sanitizeHeaders = (headers: any, sensitiveHeaders: string[]): any => {
  const sanitized: any = {};

  for (const key in headers) {
    if (headers.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveHeaders.some(header =>
        lowerKey.includes(header.toLowerCase())
      );

      sanitized[key] = isSensitive ? '***REDACTED***' : headers[key];
    }
  }

  return sanitized;
};

/**
 * Obtenir un emoji selon le status code
 */
const getStatusEmoji = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) return '✓';
  if (statusCode >= 300 && statusCode < 400) return '↻';
  if (statusCode >= 400 && statusCode < 500) return '⚠';
  if (statusCode >= 500) return '✗';
  return '·';
};

/**
 * Formater les bytes en format lisible
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Stocker le log pour audit (placeholder)
 */
const storeRequestLog = async (logData: RequestLog): Promise<void> => {
  // TODO: Implémenter le stockage des logs
  // Options:
  // - Base de données (table audit_logs)
  // - Service externe (CloudWatch, DataDog, etc.)
  // - File system (logs rotatifs)
  // - Queue (pour traitement asynchrone)
};

/**
 * Middleware de logging minimal (pour production)
 */
export const minimalLogger = requestLogger({ logLevel: 'minimal' });

/**
 * Middleware de logging standard
 */
export const standardLogger = requestLogger({ logLevel: 'standard' });

/**
 * Middleware de logging verbose (pour debug)
 */
export const verboseLogger = requestLogger({
  logLevel: 'verbose',
  includeBody: true,
  includeQuery: true,
  includeHeaders: true,
});

/**
 * Logger adaptatif selon l'environnement
 */
export const adaptiveLogger = process.env.NODE_ENV === 'production'
  ? minimalLogger
  : standardLogger;

// Augmenter les types Express
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      markPerformance?: (name: string) => void;
    }
  }
}

export default {
  requestLogger,
  performanceLogger,
  sensitiveResourceLogger,
  dataChangeLogger,
  minimalLogger,
  standardLogger,
  verboseLogger,
  adaptiveLogger,
};
