/**
 * Service Compte - Orchestrateur pour la gestion des comptes utilisateurs
 * 
 * Ce service centralise toutes les opérations liées aux comptes.
 * Il délègue le traitement aux modules spécialisés dans core/
 */

import type { 
  CompteInfo,
  CompteUpdateInput,
  ComptePasswordUpdate,
  ConversionInput,
  ConversionResult,
} from '@clubmanager/types';

// Import depuis l'index core qui réexporte tout
import * as core from './core/index.js';

/**
 * Service principal pour la gestion des comptes
 */
export class CompteService {
  // ============================================
  // QUERIES
  // ============================================

  /**
   * Récupère un compte par ID
   */
  async obtenirCompteParId(utilisateurId: number): Promise<CompteInfo | null> {
    return core.obtenirCompteParId(utilisateurId);
  }

  /**
   * Récupère un compte par prénom et nom
   */
  async obtenirCompteParNomPrenom(prenom: string, nom: string): Promise<CompteInfo[]> {
    return core.obtenirCompteParNomPrenom(prenom, nom);
  }

  /**
   * Récupère les informations complètes d'un compte
   */
  async obtenirInformationsCompte(prenom: string, nom: string): Promise<CompteInfo | null> {
    return core.obtenirInformationsCompte(prenom, nom);
  }

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Modifie un compte
   */
  async modifierCompte(utilisateurId: number, updates: CompteUpdateInput): Promise<CompteInfo | null> {
    return core.modifierCompte(utilisateurId, updates);
  }

  /**
   * Modifie un compte avec conversion automatique des noms
   */
  async modifierCompteAvecConversion(utilisateurId: number, updates: any): Promise<CompteInfo | null> {
    console.log(`🔄 [CompteService] Modification avec conversion pour utilisateur ${utilisateurId}`);

    // Convertir les noms en IDs
    const conversions = await core.convertirNomsEnIds(updates);

    // Fusionner les conversions avec les updates
    const finalUpdates: CompteUpdateInput = {
      ...updates,
      genre_id: conversions.genre_id,
      grade_id: conversions.grade_id,
      status_id: conversions.status_id,
      abonnement_id: conversions.abonnement_id,
    };

    return core.modifierCompte(utilisateurId, finalUpdates);
  }

  /**
   * Supprime un compte (soft delete)
   */
  async supprimerCompte(utilisateurId: number): Promise<boolean> {
    return core.supprimerCompte(utilisateurId);
  }

  /**
   * Met à jour le mot de passe d'un utilisateur
   */
  async mettreAJourMotDePasse(data: ComptePasswordUpdate): Promise<boolean> {
    return core.mettreAJourMotDePasse(data.utilisateur_id, data.new_password, data.is_creation);
  }

  // ============================================
  // CONVERSIONS
  // ============================================

  /**
   * Obtient l'ID d'un genre par son nom
   */
  async obtenirIdGenre(genreName: string): Promise<number> {
    return core.obtenirIdGenreParNom(genreName);
  }

  /**
   * Obtient l'ID d'un grade par son nom
   */
  async obtenirIdGrade(gradeName: string): Promise<number> {
    return core.obtenirIdGradeParNom(gradeName);
  }

  /**
   * Obtient l'ID d'un status par son nom
   */
  async obtenirIdStatus(statusName: string): Promise<number> {
    return core.obtenirIdStatusParNom(statusName);
  }

  /**
   * Obtient l'ID d'un abonnement par son nom
   */
  async obtenirIdAbonnement(abonnementName: string): Promise<number> {
    return core.obtenirIdAbonnementParNom(abonnementName);
  }

  /**
   * Convertit automatiquement les noms en IDs
   */
  async convertirNomsEnIds(input: ConversionInput): Promise<ConversionResult> {
    return core.convertirNomsEnIds(input);
  }
}

// Export d'une instance unique
export const compteService = new CompteService();
