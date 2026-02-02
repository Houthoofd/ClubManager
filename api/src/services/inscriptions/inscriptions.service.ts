/**
 * Service Inscriptions - Orchestrateur principal
 * Gestion des inscriptions aux cours avec validation et statistiques
 */

import type {
  Inscription,
  InscriptionInput,
  InscriptionUpdateInput,
  InscriptionResult,
  InscriptionStats,
  InscriptionValidation,
} from '@clubmanager/types';

// Import depuis l'index core qui réexporte tout
import * as core from './core/index.js';

/**
 * Service principal de gestion des inscriptions
 */
export class InscriptionsService {
  // ==================== QUERIES ====================

  /**
   * Obtient toutes les inscriptions
   */
  async obtenirToutesLesInscriptions(): Promise<Inscription[]> {
    return core.obtenirToutesLesInscriptions();
  }

  /**
   * Obtient une inscription par ID
   */
  async obtenirInscriptionParId(id: number): Promise<Inscription | null> {
    return core.obtenirInscriptionParId(id);
  }

  /**
   * Obtient les inscriptions d'un utilisateur
   */
  async obtenirInscriptionsParUtilisateur(utilisateurId: number): Promise<Inscription[]> {
    return core.obtenirInscriptionsParUtilisateur(utilisateurId);
  }

  /**
   * Obtient les inscriptions pour un cours
   */
  async obtenirInscriptionsParCours(coursId: number): Promise<Inscription[]> {
    return core.obtenirInscriptionsParCours(coursId);
  }

  /**
   * Obtient les inscriptions actives
   */
  async obtenirInscriptionsActives(): Promise<Inscription[]> {
    return core.obtenirInscriptionsActives();
  }

  // ==================== MUTATIONS ====================

  /**
   * Crée une nouvelle inscription avec validation
   */
  async creerInscription(data: InscriptionInput): Promise<InscriptionResult> {
    try {
      // Valider la disponibilité
      const validation = await core.verifierDisponibiliteInscription(
        data.utilisateur_id,
        data.cours_id
      );

      if (!validation.disponible) {
        return {
          success: false,
          message: validation.raison || 'Inscription non disponible',
        };
      }

      // Créer l'inscription
      const inscription = await core.creerInscription(data);

      return {
        success: true,
        message: 'Inscription créée avec succès',
        data: inscription,
      };
    } catch (error) {
      console.error('❌ [InscriptionsService] Erreur création:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la création',
      };
    }
  }

  /**
   * Met à jour une inscription
   */
  async modifierInscription(id: number, data: InscriptionUpdateInput): Promise<InscriptionResult> {
    try {
      const inscription = await core.modifierInscription(id, data);

      if (!inscription) {
        return {
          success: false,
          message: 'Inscription non trouvée',
        };
      }

      return {
        success: true,
        message: 'Inscription modifiée avec succès',
        data: inscription,
      };
    } catch (error) {
      console.error('❌ [InscriptionsService] Erreur modification:', error);
      return {
        success: false,
        message: 'Erreur lors de la modification',
      };
    }
  }

  /**
   * Supprime une inscription
   */
  async supprimerInscription(id: number): Promise<InscriptionResult> {
    try {
      const success = await core.supprimerInscription(id);

      if (!success) {
        return {
          success: false,
          message: 'Inscription non trouvée',
        };
      }

      return {
        success: true,
        message: 'Inscription supprimée avec succès',
      };
    } catch (error) {
      console.error('❌ [InscriptionsService] Erreur suppression:', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression',
      };
    }
  }

  /**
   * Annule une inscription (soft delete)
   */
  async annulerInscription(id: number): Promise<InscriptionResult> {
    try {
      const inscription = await core.annulerInscription(id);

      if (!inscription) {
        return {
          success: false,
          message: 'Inscription non trouvée',
        };
      }

      return {
        success: true,
        message: 'Inscription annulée avec succès',
        data: inscription,
      };
    } catch (error) {
      console.error('❌ [InscriptionsService] Erreur annulation:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'annulation',
      };
    }
  }

  /**
   * Active une inscription
   */
  async activerInscription(id: number): Promise<InscriptionResult> {
    try {
      const inscription = await core.activerInscription(id);

      if (!inscription) {
        return {
          success: false,
          message: 'Inscription non trouvée',
        };
      }

      return {
        success: true,
        message: 'Inscription activée avec succès',
        data: inscription,
      };
    } catch (error) {
      console.error('❌ [InscriptionsService] Erreur activation:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'activation',
      };
    }
  }

  // ==================== VALIDATION ====================

  /**
   * Vérifie la disponibilité d'une inscription
   */
  async verifierDisponibilite(
    utilisateurId: number,
    coursId: number
  ): Promise<InscriptionValidation> {
    return core.verifierDisponibiliteInscription(utilisateurId, coursId);
  }

  /**
   * Compte les inscriptions pour un cours
   */
  async compterInscriptionsCours(coursId: number): Promise<number> {
    return core.compterInscriptionsCours(coursId);
  }

  /**
   * Vérifie si un cours est complet
   */
  async verifierCoursComplet(coursId: number): Promise<boolean> {
    return core.verifierCoursComplet(coursId);
  }

  // ==================== STATISTIQUES ====================

  /**
   * Obtient les statistiques globales
   */
  async obtenirStatistiques(): Promise<InscriptionStats> {
    return core.obtenirStatistiquesInscriptions();
  }

  /**
   * Obtient le nombre d'inscriptions sur une période
   */
  async obtenirInscriptionsParPeriode(dateDebut: Date, dateFin: Date): Promise<number> {
    return core.obtenirInscriptionsParPeriode(dateDebut, dateFin);
  }
}

// Export singleton
export const inscriptionsService = new InscriptionsService();
