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

// Import des modules core
import {
  obtenirToutesCommandes,
  obtenirCommandeParId,
  obtenirCommandesUtilisateur,
  obtenirCommandesParStatut,
  compterCommandesParStatut,
} from './core/queries.js';

import {
  creerCommande,
  modifierCommande,
  modifierStatutCommande,
  supprimerCommande,
} from './core/mutations.js';

import {
  obtenirStatistiquesCommandes,
  obtenirComptesParStatut,
} from './core/stats.js';

import {
  rechercherCommandes,
} from './core/search.js';

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
    return obtenirToutesCommandes();
  }

  /**
   * Récupère une commande par son ID
   */
  async obtenirCommandeParId(commandeId: string): Promise<Commande | null> {
    return obtenirCommandeParId(commandeId);
  }

  /**
   * Récupère les commandes d'un utilisateur
   */
  async obtenirCommandesUtilisateur(utilisateurId: number): Promise<Commande[]> {
    return obtenirCommandesUtilisateur(utilisateurId);
  }

  /**
   * Récupère les commandes par statut
   */
  async obtenirCommandesParStatut(statut: string): Promise<Commande[]> {
    return obtenirCommandesParStatut(statut);
  }

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Crée une nouvelle commande
   */
  async creerCommande(input: CreateCommandeInput): Promise<Commande> {
    return creerCommande(input);
  }

  /**
   * Modifie une commande
   */
  async modifierCommande(commandeId: string, updates: UpdateCommandeInput): Promise<Commande | null> {
    return modifierCommande(commandeId, updates);
  }

  /**
   * Modifie le statut d'une commande
   */
  async modifierStatutCommande(commandeId: string, nouveauStatut: string): Promise<Commande | null> {
    return modifierStatutCommande(commandeId, nouveauStatut);
  }

  /**
   * Supprime une commande
   */
  async supprimerCommande(commandeId: string): Promise<boolean> {
    return supprimerCommande(commandeId);
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques des commandes
   */
  async obtenirStatistiques(): Promise<CommandeStats> {
    return obtenirStatistiquesCommandes();
  }

  /**
   * Compte les commandes par statut
   */
  async compterParStatut(): Promise<CommandeCountByStatut[]> {
    return obtenirComptesParStatut();
  }

  // ============================================
  // RECHERCHE
  // ============================================

  /**
   * Recherche des commandes avec filtres
   */
  async rechercherCommandes(filters: CommandeSearchFilters): Promise<CommandeSearchResult> {
    return rechercherCommandes(filters);
  }
}

// Export d'une instance unique
export const commandesService = new CommandesService();
