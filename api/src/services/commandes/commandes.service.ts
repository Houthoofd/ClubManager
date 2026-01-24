/**
 * Service Commandes - Orchestrateur pour la gestion des commandes
 * 
 * Ce service centralise toutes les opérations liées aux commandes.
 * Il délègue le traitement aux modules spécialisés dans core/
 */

import type { 
  Commande, 
  CommandeStats, 
  CommandeCountByStatut,
  CreateCommandeInput,
  UpdateCommandeInput,
  CommandeSearchFilters,
  CommandeSearchResult
} from '@clubmanager/types';

// Import depuis l'index core qui réexporte tout
import * as core from './core/index.js';

/**
 * Service principal pour la gestion des commandes
 */
export class CommandesService {
  // ============================================
  // QUERIES
  // ============================================

  /**
   * Récupère toutes les commandes
   */
  async obtenirToutesCommandes(): Promise<Commande[]> {
    return core.obtenirToutesCommandes();
  }

  /**
   * Récupère une commande par son ID
   */
  async obtenirCommandeParId(commandeId: string): Promise<Commande | null> {
    return core.obtenirCommandeParId(commandeId);
  }

  /**
   * Récupère les commandes d'un utilisateur
   */
  async obtenirCommandesUtilisateur(utilisateurId: number): Promise<Commande[]> {
    return core.obtenirCommandesUtilisateur(utilisateurId);
  }

  /**
   * Récupère les commandes par statut
   */
  async obtenirCommandesParStatut(statut: string): Promise<Commande[]> {
    return core.obtenirCommandesParStatut(statut);
  }

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Crée une nouvelle commande
   */
  async creerCommande(input: CreateCommandeInput): Promise<Commande> {
    return core.creerCommande(input);
  }

  /**
   * Modifie une commande
   */
  async modifierCommande(commandeId: string, updates: UpdateCommandeInput): Promise<Commande | null> {
    return core.modifierCommande(commandeId, updates);
  }

  /**
   * Modifie le statut d'une commande
   */
  async modifierStatutCommande(commandeId: string, nouveauStatut: string): Promise<Commande | null> {
    return core.modifierStatutCommande(commandeId, nouveauStatut);
  }

  /**
   * Supprime une commande
   */
  async supprimerCommande(commandeId: string): Promise<boolean> {
    return core.supprimerCommande(commandeId);
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques des commandes
   */
  async obtenirStatistiques(): Promise<CommandeStats> {
    return core.obtenirStatistiquesCommandes();
  }

  /**
   * Compte les commandes par statut
   */
  async compterParStatut(): Promise<CommandeCountByStatut[]> {
    return core.obtenirComptesParStatut();
  }

  // ============================================
  // RECHERCHE
  // ============================================

  /**
   * Recherche des commandes avec filtres
   */
  async rechercherCommandes(filters: CommandeSearchFilters): Promise<CommandeSearchResult> {
    return core.rechercherCommandes(filters);
  }
}

// Export d'une instance unique
export const commandesService = new CommandesService();
