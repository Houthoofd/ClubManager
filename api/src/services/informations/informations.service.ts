/**
 * Service Informations - Orchestrateur principal
 * Gestion des informations du club et des référentiels
 */

import type {
  Information,
  InformationInput,
  InformationResult,
  Status,
  PlanTarifaire,
  Grade,
} from '@clubmanager/types';

// Import depuis l'index core qui réexporte tout
import * as core from './core/index.js';

/**
 * Service principal de gestion des informations
 * Délègue les opérations aux modules spécialisés
 */
export class InformationsService {
  // ============================================
  // QUERIES INFORMATIONS
  // ============================================

  /**
   * Récupère toutes les informations actives
   */
  async obtenirToutesLesInformations(): Promise<Information[]> {
    return core.obtenirToutesLesInformations();
  }

  /**
   * Récupère une information par son ID
   */
  async obtenirInformationParId(id: number): Promise<Information | null> {
    return core.obtenirInformationParId(id);
  }

  // ============================================
  // MUTATIONS INFORMATIONS
  // ============================================

  /**
   * Ajoute une nouvelle information
   */
  async ajouterInformation(data: InformationInput): Promise<InformationResult> {
    return core.ajouterInformation(data);
  }

  /**
   * Modifie une information existante
   */
  async modifierInformation(id: number, data: InformationInput): Promise<InformationResult> {
    return core.modifierInformation(id, data);
  }

  /**
   * Supprime une information (soft delete)
   */
  async supprimerInformation(id: number): Promise<InformationResult> {
    return core.supprimerInformation(id);
  }

  // ============================================
  // QUERIES RÉFÉRENTIELS
  // ============================================

  /**
   * Récupère tous les status
   */
  async obtenirLesStatus(): Promise<Status[]> {
    return core.obtenirLesStatus();
  }

  /**
   * Récupère tous les plans tarifaires
   */
  async obtenirLesPlansTarifaires(): Promise<PlanTarifaire[]> {
    return core.obtenirLesPlansTarifaires();
  }

  /**
   * Récupère tous les genres
   */
  async obtenirLesGenres(): Promise<{ id: number; nom: string }[]> {
    return core.obtenirLesGenres();
  }

  /**
   * Récupère tous les grades
   */
  async obtenirLesGrades(): Promise<Grade[]> {
    return core.obtenirLesGrades();
  }
}

// Instance singleton
export const informationsService = new InformationsService();
