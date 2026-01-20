import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors.util.js';

/**
 * Middleware de validation générique avec Zod
 * Valide le body, query params ou route params selon le type spécifié
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];

      // Valider et parser les données
      const validatedData = await schema.parseAsync(dataToValidate);

      // Remplacer les données par les données validées et transformées
      req[source] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formater les erreurs Zod de manière lisible
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: formattedErrors,
          timestamp: new Date().toISOString(),
        });
      }

      // Autres erreurs
      next(error);
    }
  };
};

/**
 * Middleware de validation pour le body de la requête
 */
export const validateBody = (schema: ZodSchema) => {
  return validate(schema, 'body');
};

/**
 * Middleware de validation pour les query params
 */
export const validateQuery = (schema: ZodSchema) => {
  return validate(schema, 'query');
};

/**
 * Middleware de validation pour les route params
 */
export const validateParams = (schema: ZodSchema) => {
  return validate(schema, 'params');
};

/**
 * Middleware de validation multiple (body + query + params)
 */
export const validateRequest = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: any[] = [];

      // Valider le body
      if (schemas.body) {
        try {
          req.body = await schemas.body.parseAsync(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map(err => ({
              source: 'body',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })));
          }
        }
      }

      // Valider les query params
      if (schemas.query) {
        try {
          req.query = await schemas.query.parseAsync(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map(err => ({
              source: 'query',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })));
          }
        }
      }

      // Valider les route params
      if (schemas.params) {
        try {
          req.params = await schemas.params.parseAsync(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map(err => ({
              source: 'params',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })));
          }
        }
      }

      // S'il y a des erreurs, renvoyer une réponse 400
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware de validation pour les fichiers uploadés
 */
export const validateFile = (options: {
  required?: boolean;
  maxSize?: number; // en bytes
  allowedTypes?: string[]; // MIME types
  fieldName?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      required = false,
      maxSize = 5 * 1024 * 1024, // 5MB par défaut
      allowedTypes = [],
      fieldName = 'file',
    } = options;

    const file = req.file || (req.files as any)?.[fieldName];

    // Vérifier si le fichier est requis
    if (required && !file) {
      return res.status(400).json({
        success: false,
        error: 'File is required',
        field: fieldName,
        timestamp: new Date().toISOString(),
      });
    }

    // Si pas de fichier et pas requis, continuer
    if (!file) {
      return next();
    }

    // Vérifier la taille
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        maxSize,
        actualSize: file.size,
        field: fieldName,
        timestamp: new Date().toISOString(),
      });
    }

    // Vérifier le type MIME
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        allowedTypes,
        actualType: file.mimetype,
        field: fieldName,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Middleware de validation pour plusieurs fichiers
 */
export const validateFiles = (options: {
  required?: boolean;
  maxFiles?: number;
  maxSize?: number; // en bytes par fichier
  allowedTypes?: string[];
  fieldName?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      required = false,
      maxFiles = 10,
      maxSize = 5 * 1024 * 1024,
      allowedTypes = [],
      fieldName = 'files',
    } = options;

    const files = (req.files as any)?.[fieldName] || req.files || [];

    // Vérifier si les fichiers sont requis
    if (required && files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Files are required',
        field: fieldName,
        timestamp: new Date().toISOString(),
      });
    }

    // Si pas de fichiers et pas requis, continuer
    if (files.length === 0) {
      return next();
    }

    // Vérifier le nombre de fichiers
    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        maxFiles,
        actualCount: files.length,
        field: fieldName,
        timestamp: new Date().toISOString(),
      });
    }

    // Vérifier chaque fichier
    for (const file of files) {
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: 'File too large',
          maxSize,
          actualSize: file.size,
          fileName: file.originalname,
          field: fieldName,
          timestamp: new Date().toISOString(),
        });
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type',
          allowedTypes,
          actualType: file.mimetype,
          fileName: file.originalname,
          field: fieldName,
          timestamp: new Date().toISOString(),
        });
      }
    }

    next();
  };
};

/**
 * Middleware de sanitization basique
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        // Supprimer les caractères dangereux de base
        return obj.trim().replace(/[<>]/g, '');
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitize(obj[key]);
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
  validateFile,
  validateFiles,
  sanitizeInput,
};
