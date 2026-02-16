/**
 * Types pour les services métier de Sports
 * Interfaces et types pour la couche service
 */

import type {
  Sport,
  CreateSportInput,
  UpdateSportInput,
  CreateSportResult,
  UpdateSportResult,
} from "./types.js";

/**
 * Interface du service de gestion des Sports
 */
export interface SportsService {
  /**
   * Créer un nouveau Sports
   */
  create(data: CreateSportInput): Promise<CreateSportResult>;

  /**
   * Récupérer un Sports par son ID
   */
  findById(id: number): Promise<Sport | null>;

  /**
   * Mettre à jour un Sports
   */
  update(id: number, data: UpdateSportInput): Promise<UpdateSportResult>;

  /**
   * Supprimer un Sports
   */
  delete(id: number): Promise<boolean>;

  /**
   * Lister tous les Sports
   */
  findAll(): Promise<Sport[]>;
}

/**
 * Options de configuration pour le service Sports
 */
export interface SportsServiceConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
}

/**
 * Événements émis par le service Sports
 */
export type SportsServiceEvent =
  | { type: "created"; sport: Sport }
  | { type: "updated"; sport: Sport }
  | { type: "deleted"; id: number };
