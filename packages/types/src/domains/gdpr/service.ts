/**
 * Types pour les services métier de Gdpr
 * Interfaces et types pour la couche service
 */

import type {
  UserConsent,
  DataExportRequest,
  AccountDeletionRequest,
  CreateUserConsentInput,
  CreateDataExportRequestInput,
  CreateAccountDeletionRequestInput,
  CreateConsentResult,
  CreateDataExportResult,
  CreateAccountDeletionResult,
} from "./types.js";

/**
 * Interface du service de gestion GDPR
 */
export interface GdprService {
  /**
   * Créer un nouveau consentement
   */
  createConsent(data: CreateUserConsentInput): Promise<CreateConsentResult>;

  /**
   * Récupérer les consentements d'un utilisateur
   */
  getUserConsents(userId: number): Promise<UserConsent[]>;

  /**
   * Créer une demande d'export de données
   */
  createDataExportRequest(
    data: CreateDataExportRequestInput,
  ): Promise<CreateDataExportResult>;

  /**
   * Récupérer une demande d'export par son ID
   */
  getDataExportRequest(id: number): Promise<DataExportRequest | null>;

  /**
   * Créer une demande de suppression de compte
   */
  createAccountDeletionRequest(
    data: CreateAccountDeletionRequestInput,
  ): Promise<CreateAccountDeletionResult>;

  /**
   * Récupérer une demande de suppression par son ID
   */
  getAccountDeletionRequest(id: number): Promise<AccountDeletionRequest | null>;

  /**
   * Lister toutes les demandes d'export
   */
  listDataExportRequests(): Promise<DataExportRequest[]>;

  /**
   * Lister toutes les demandes de suppression
   */
  listAccountDeletionRequests(): Promise<AccountDeletionRequest[]>;
}

/**
 * Options de configuration pour le service Gdpr
 */
export interface GdprServiceConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
}

/**
 * Événements émis par le service GDPR
 */
export type GdprServiceEvent =
  | { type: "consent_created"; consent: UserConsent }
  | { type: "consent_revoked"; userId: number; consentType: string }
  | { type: "export_requested"; request: DataExportRequest }
  | { type: "export_completed"; requestId: number }
  | { type: "deletion_requested"; request: AccountDeletionRequest }
  | { type: "deletion_completed"; requestId: number };
