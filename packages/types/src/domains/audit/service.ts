/**
 * Types pour les services métier de Audit
 * Interfaces et types pour la couche service
 */

import type {
  AuditLog,
  CreateAuditLogInput,
  CreateAuditLogResult,
} from "./types.js";

/**
 * Interface du service de gestion des Audit Logs
 */
export interface AuditService {
  /**
   * Créer un nouveau log d'audit
   */
  create(data: CreateAuditLogInput): Promise<CreateAuditLogResult>;

  /**
   * Récupérer un log d'audit par son ID
   */
  findById(id: string): Promise<AuditLog | null>;

  /**
   * Supprimer un log d'audit
   */
  delete(id: string): Promise<boolean>;

  /**
   * Lister tous les logs d'audit
   */
  findAll(): Promise<AuditLog[]>;
}

/**
 * Options de configuration pour le service Audit
 */
export interface AuditServiceConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
}

/**
 * Événements émis par le service Audit
 */
export type AuditServiceEvent =
  | { type: "created"; auditLog: AuditLog }
  | { type: "deleted"; id: string };
