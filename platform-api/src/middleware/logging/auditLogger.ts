import { Request, Response, NextFunction } from 'express';
import auditService, { AuditAction } from '../../services/infrastructure/audit/audit.service.js';

/**
 * Middleware pour logger automatiquement les requêtes
 */
export const auditLogger = (action: AuditAction, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Capturer la réponse originale
    const originalJson = res.json.bind(res);
    
    res.json = function (data: any) {
      // Logger après la réponse réussie
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const tenantId = req.tenant?.tenantId;
        const userId = req.user?.id;
        
        if (tenantId) {
          const resourceId = data?.id || req.params.id || undefined;
          
          auditService.log({
            tenantId,
            userId,
            action,
            resource,
            resourceId,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent'),
          }).catch(err => {
            console.error('Audit logging failed:', err);
          });
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Middleware pour logger les modifications (UPDATE)
 */
export const auditUpdate = (resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.tenant?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      return next();
    }
    
    // Stocker les données avant modification pour comparaison
    req.auditBefore = req.body;
    
    const originalJson = res.json.bind(res);
    
    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        auditService.logCrud(
          tenantId,
          userId,
          AuditAction.UPDATE,
          resource,
          req.params.id || data?.id,
          {
            before: req.auditBefore,
            after: data,
          },
          req.ip || req.socket.remoteAddress || 'unknown',
          req.get('user-agent')
        ).catch(err => {
          console.error('Audit logging failed:', err);
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Middleware pour logger les suppressions (DELETE)
 */
export const auditDelete = (resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const tenantId = req.tenant?.tenantId;
        const userId = req.user?.id;
        
        if (tenantId && userId) {
          auditService.logCrud(
            tenantId,
            userId,
            AuditAction.DELETE,
            resource,
            req.params.id,
            undefined,
            req.ip || req.socket.remoteAddress || 'unknown',
            req.get('user-agent')
          ).catch(err => {
            console.error('Audit logging failed:', err);
          });
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

// Augmenter les types Express
declare global {
  namespace Express {
    interface Request {
      auditBefore?: any;
    }
  }
}

export default auditLogger;
