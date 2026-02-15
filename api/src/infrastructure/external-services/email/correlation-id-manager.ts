/**
 * 🔗 Correlation ID Manager
 *
 * Gère les correlation IDs pour le tracing distribué :
 * - Génération automatique d'IDs uniques
 * - Propagation à travers les services
 * - Context storage avec CLS (Continuation-Local Storage)
 * - Logging enrichi avec correlation IDs
 *
 * @module correlation-id-manager
 * @since Phase 2
 */

import { v4 as uuidv4 } from 'uuid';
import { createNamespace, getNamespace, Namespace } from 'cls-hooked';

/**
 * Nom du namespace CLS pour les correlation IDs
 */
const NAMESPACE_NAME = 'email-correlation-context';

/**
 * Clé pour stocker le correlation ID dans le context
 */
const CORRELATION_ID_KEY = 'correlationId';

/**
 * Clé pour stocker les metadata dans le context
 */
const METADATA_KEY = 'metadata';

/**
 * Interface pour les metadata associées à un correlation ID
 */
export interface CorrelationMetadata {
  userId?: string;
  emailId?: string;
  operation?: string;
  template?: string;
  priority?: 'urgent' | 'normal' | 'low';
  timestamp?: Date;
  parentId?: string;
  tags?: Record<string, string>;
}

/**
 * Interface pour le contexte complet
 */
export interface CorrelationContext {
  correlationId: string;
  metadata: CorrelationMetadata;
}

/**
 * Options de configuration du CorrelationIdManager
 */
export interface CorrelationIdConfig {
  enabled: boolean;
  headerName: string;
  prefix?: string;
  includeTimestamp?: boolean;
}

/**
 * Manager pour la gestion des correlation IDs
 */
export class CorrelationIdManager {
  private namespace: Namespace;
  private config: CorrelationIdConfig;

  constructor(config: Partial<CorrelationIdConfig> = {}) {
    this.config = {
      enabled: true,
      headerName: 'X-Correlation-ID',
      prefix: 'email',
      includeTimestamp: true,
      ...config
    };

    // Créer ou récupérer le namespace CLS
    this.namespace = getNamespace(NAMESPACE_NAME) || createNamespace(NAMESPACE_NAME);
  }

  /**
   * Génère un nouveau correlation ID unique
   */
  generateId(): string {
    const uuid = uuidv4();
    const prefix = this.config.prefix ? `${this.config.prefix}-` : '';
    const timestamp = this.config.includeTimestamp ? `-${Date.now()}` : '';
    return `${prefix}${uuid}${timestamp}`;
  }

  /**
   * Extrait un correlation ID d'une requête HTTP
   */
  extractFromRequest(headers: Record<string, string | string[] | undefined>): string | null {
    const headerValue = headers[this.config.headerName.toLowerCase()] ||
                       headers[this.config.headerName];

    if (Array.isArray(headerValue)) {
      return headerValue[0] || null;
    }

    return headerValue || null;
  }

  /**
   * Exécute une fonction dans un contexte avec correlation ID
   */
  runWithId<T>(correlationId: string, metadata: CorrelationMetadata, fn: () => T): T {
    if (!this.config.enabled) {
      return fn();
    }

    return this.namespace.runAndReturn(() => {
      this.namespace.set(CORRELATION_ID_KEY, correlationId);
      this.namespace.set(METADATA_KEY, {
        ...metadata,
        timestamp: metadata.timestamp || new Date()
      });
      return fn();
    });
  }

  /**
   * Exécute une fonction asynchrone dans un contexte avec correlation ID
   */
  async runWithIdAsync<T>(
    correlationId: string,
    metadata: CorrelationMetadata,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    return new Promise((resolve, reject) => {
      this.namespace.run(() => {
        this.namespace.set(CORRELATION_ID_KEY, correlationId);
        this.namespace.set(METADATA_KEY, {
          ...metadata,
          timestamp: metadata.timestamp || new Date()
        });
        fn().then(resolve).catch(reject);
      });
    });
  }

  /**
   * Récupère le correlation ID du contexte actuel
   */
  getCurrentId(): string | null {
    if (!this.config.enabled) {
      return null;
    }

    return this.namespace.get(CORRELATION_ID_KEY) || null;
  }

  /**
   * Récupère les metadata du contexte actuel
   */
  getCurrentMetadata(): CorrelationMetadata | null {
    if (!this.config.enabled) {
      return null;
    }

    return this.namespace.get(METADATA_KEY) || null;
  }

  /**
   * Récupère le contexte complet actuel
   */
  getCurrentContext(): CorrelationContext | null {
    const correlationId = this.getCurrentId();
    const metadata = this.getCurrentMetadata();

    if (!correlationId) {
      return null;
    }

    return {
      correlationId,
      metadata: metadata || {}
    };
  }

  /**
   * Met à jour les metadata du contexte actuel
   */
  updateMetadata(updates: Partial<CorrelationMetadata>): void {
    if (!this.config.enabled) {
      return;
    }

    const current = this.getCurrentMetadata() || {};
    this.namespace.set(METADATA_KEY, { ...current, ...updates });
  }

  /**
   * Ajoute un tag aux metadata
   */
  addTag(key: string, value: string): void {
    if (!this.config.enabled) {
      return;
    }

    const metadata = this.getCurrentMetadata() || {};
    const tags = metadata.tags || {};
    this.updateMetadata({
      tags: { ...tags, [key]: value }
    });
  }

  /**
   * Crée un correlation ID enfant pour une sous-opération
   */
  createChildId(operation?: string): string {
    const parentId = this.getCurrentId();
    const childId = this.generateId();

    if (parentId && this.config.enabled) {
      this.updateMetadata({ parentId });
      if (operation) {
        this.updateMetadata({ operation });
      }
    }

    return childId;
  }

  /**
   * Middleware Express pour injecter automatiquement les correlation IDs
   */
  expressMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.config.enabled) {
        return next();
      }

      // Extraire ou générer un correlation ID
      let correlationId = this.extractFromRequest(req.headers);
      if (!correlationId) {
        correlationId = this.generateId();
      }

      // Ajouter le header à la réponse
      res.setHeader(this.config.headerName, correlationId);

      // Exécuter la requête dans le contexte
      this.namespace.run(() => {
        this.namespace.set(CORRELATION_ID_KEY, correlationId);
        this.namespace.set(METADATA_KEY, {
          timestamp: new Date(),
          operation: `${req.method} ${req.path}`
        });
        next();
      });
    };
  }

  /**
   * Crée un logger enrichi avec le correlation ID
   */
  createLogger(baseLogger: any = console) {
    return {
      log: (...args: any[]) => this.log(baseLogger, 'log', ...args),
      info: (...args: any[]) => this.log(baseLogger, 'info', ...args),
      warn: (...args: any[]) => this.log(baseLogger, 'warn', ...args),
      error: (...args: any[]) => this.log(baseLogger, 'error', ...args),
      debug: (...args: any[]) => this.log(baseLogger, 'debug', ...args)
    };
  }

  /**
   * Log avec correlation ID et metadata
   */
  private log(baseLogger: any, level: string, ...args: any[]): void {
    const context = this.getCurrentContext();

    if (context) {
      const prefix = `[${context.correlationId}]`;
      const metadata = context.metadata;

      if (metadata.operation) {
        baseLogger[level](prefix, `[${metadata.operation}]`, ...args);
      } else {
        baseLogger[level](prefix, ...args);
      }
    } else {
      baseLogger[level](...args);
    }
  }

  /**
   * Formate le contexte pour les logs structurés (JSON)
   */
  formatForStructuredLogging(): Record<string, any> {
    const context = this.getCurrentContext();

    if (!context) {
      return {};
    }

    return {
      correlationId: context.correlationId,
      ...context.metadata,
      timestamp: context.metadata.timestamp?.toISOString()
    };
  }

  /**
   * Crée des headers HTTP avec le correlation ID pour les appels externes
   */
  createHttpHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const correlationId = this.getCurrentId();

    if (!correlationId) {
      return additionalHeaders;
    }

    return {
      [this.config.headerName]: correlationId,
      ...additionalHeaders
    };
  }

  /**
   * Trace une opération avec début et fin
   */
  async traceOperation<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Partial<CorrelationMetadata>
  ): Promise<T> {
    const startTime = Date.now();
    const correlationId = this.getCurrentId() || this.generateId();

    try {
      this.updateMetadata({
        operation: operationName,
        ...metadata
      });

      const result = await fn();

      const duration = Date.now() - startTime;
      this.addTag('duration_ms', duration.toString());
      this.addTag('status', 'success');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTag('duration_ms', duration.toString());
      this.addTag('status', 'error');
      this.addTag('error_message', error instanceof Error ? error.message : 'Unknown error');

      throw error;
    }
  }

  /**
   * Active ou désactive le correlation ID manager
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Vérifie si le manager est activé
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): CorrelationIdConfig {
    return { ...this.config };
  }
}

/**
 * Instance singleton du CorrelationIdManager
 */
let correlationIdManagerInstance: CorrelationIdManager | null = null;

/**
 * Récupère ou crée l'instance singleton du manager
 */
export function getCorrelationIdManager(config?: Partial<CorrelationIdConfig>): CorrelationIdManager {
  if (!correlationIdManagerInstance) {
    correlationIdManagerInstance = new CorrelationIdManager(config);
  }
  return correlationIdManagerInstance;
}

/**
 * Réinitialise l'instance singleton (utile pour les tests)
 */
export function resetCorrelationIdManager(): void {
  correlationIdManagerInstance = null;
}

/**
 * Helper pour exécuter du code avec un nouveau correlation ID
 */
export async function withCorrelationId<T>(
  metadata: CorrelationMetadata,
  fn: () => Promise<T>
): Promise<T> {
  const manager = getCorrelationIdManager();
  const correlationId = manager.generateId();
  return manager.runWithIdAsync(correlationId, metadata, fn);
}

/**
 * Helper pour récupérer le correlation ID actuel
 */
export function getCurrentCorrelationId(): string | null {
  const manager = getCorrelationIdManager();
  return manager.getCurrentId();
}

/**
 * Helper pour créer un logger avec correlation ID
 */
export function createCorrelatedLogger(baseLogger?: any) {
  const manager = getCorrelationIdManager();
  return manager.createLogger(baseLogger);
}

/**
 * Décorateur pour tracer automatiquement une méthode
 */
export function Traced(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const manager = getCorrelationIdManager();
      return manager.traceOperation(
        operation,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
