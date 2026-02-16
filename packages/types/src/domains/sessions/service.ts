/**
 * Types pour les services métier de Sessions
 * Interfaces et types pour la couche service
 */

import type {
  Session,
  CreateSessionInput,
  UpdateSessionInput,
  CreateSessionResult,
  ValidateSessionResult,
  RevokeSessionResult,
} from "./types.js";

/**
 * Interface du service de gestion des Sessions
 */
export interface SessionsService {
  /**
   * Créer une nouvelle session
   */
  create(data: CreateSessionInput): Promise<CreateSessionResult>;

  /**
   * Récupérer une session par son ID
   */
  findById(id: string): Promise<Session | null>;

  /**
   * Valider une session par son token
   */
  validateSession(token: string): Promise<ValidateSessionResult>;

  /**
   * Révoquer une session
   */
  revokeSession(id: string): Promise<RevokeSessionResult>;

  /**
   * Supprimer une session
   */
  delete(id: string): Promise<void>;

  /**
   * Lister toutes les sessions
   */
  findAll(): Promise<Session[]>;
}

/**
 * Options de configuration pour le service Sessions
 */
export interface SessionsServiceConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
}

/**
 * Événements émis par le service Sessions
 */
export type SessionsServiceEvent =
  | { type: "created"; session: Session }
  | { type: "validated"; session: Session }
  | { type: "revoked"; id: string }
  | { type: "deleted"; id: string };
