/**
 * Repository principal pour le module Commandes
 * Responsabilité: Agrégation de tous les repositories spécialisés
 *
 * Architecture:
 * - ReadRepository: Opérations de lecture (SELECT)
 * - WriteRepository: Opérations d'écriture (INSERT, UPDATE, DELETE)
 * - StatsRepository: Statistiques et agrégations
 * - SearchRepository: Recherche avec filtres
 * - ValidationRepository: Validations et vérifications
 */

import MysqlConnector from "../../connector/mysqlconnector.js";
import type {
  Commande,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeStatistiques,
  CommandeSearchFilters,
  CommandeStatsPeriode,
  TopProduit,
} from "./types.js";

// Import des repositories spécialisés
import { CommandesReadRepository } from "./repositories/read.repository.js";
import { CommandesWriteRepository } from "./repositories/write.repository.js";
import { CommandesStatsRepository } from "./repositories/stats.repository.js";
import { CommandesSearchRepository } from "./repositories/search.repository.js";
import { CommandesValidationRepository } from "./repositories/validation.repository.js";

/**
 * Repository principal pour la gestion des commandes
 * Agrège tous les repositories spécialisés
 */
export class CommandesRepository {
  private mysqlConnector: MysqlConnector;

  // Repositories spécialisés
  private readRepo: CommandesReadRepository;
  private writeRepo: CommandesWriteRepository;
  private statsRepo: CommandesStatsRepository;
  private searchRepo: CommandesSearchRepository;
  private validationRepo: CommandesValidationRepository;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();

    // Initialiser les repositories spécialisés
    this.readRepo = new CommandesReadRepository(this.mysqlConnector);
    this.writeRepo = new CommandesWriteRepository(this.mysqlConnector);
    this.statsRepo = new CommandesStatsRepository(this.mysqlConnector);
    this.searchRepo = new CommandesSearchRepository(this.mysqlConnector);
    this.validationRepo = new CommandesValidationRepository(
      this.mysqlConnector,
    );
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (délégation au ReadRepository)
  // ==========================================================================

  /**
   * Récupérer toutes les commandes avec informations utilisateur
   */
  async findAll(): Promise<Commande[]> {
    return this.readRepo.findAll();
  }

  /**
   * Récupérer une commande par son ID
   */
  async findById(commandeId: string): Promise<Commande | null> {
    return this.readRepo.findById(commandeId);
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async findByUserId(utilisateurId: number): Promise<Commande[]> {
    return this.readRepo.findByUserId(utilisateurId);
  }

  /**
   * Récupérer les commandes par statut
   */
  async findByStatut(statut: string): Promise<Commande[]> {
    return this.readRepo.findByStatut(statut);
  }

  /**
   * Récupérer une commande par payment_intent_id
   */
  async findByPaymentIntent(paymentIntentId: string): Promise<Commande | null> {
    return this.readRepo.findByPaymentIntent(paymentIntentId);
  }

  /**
   * Récupérer les commandes récentes d'un utilisateur
   */
  async getRecentUserCommandes(
    utilisateurId: number,
    minutes: number = 30,
  ): Promise<Commande[]> {
    return this.readRepo.getRecentUserCommandes(utilisateurId, minutes);
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (délégation au WriteRepository)
  // ==========================================================================

  /**
   * Créer une nouvelle commande
   */
  async create(data: CreateCommandeData): Promise<string> {
    return this.writeRepo.create(data);
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateStatut(
    commandeId: string,
    nouveauStatut: string,
  ): Promise<boolean> {
    return this.writeRepo.updateStatut(commandeId, nouveauStatut);
  }

  /**
   * Mettre à jour le total d'une commande
   */
  async updateTotal(
    commandeId: string,
    nouveauTotal: number,
  ): Promise<boolean> {
    return this.writeRepo.updateTotal(commandeId, nouveauTotal);
  }

  /**
   * Mettre à jour les articles d'une commande
   */
  async updateArticles(commandeId: string, articles: any[]): Promise<boolean> {
    return this.writeRepo.updateArticles(commandeId, articles);
  }

  /**
   * Mettre à jour le payment_intent_id d'une commande
   */
  async updatePaymentIntent(
    commandeId: string,
    paymentIntentId: string,
  ): Promise<boolean> {
    return this.writeRepo.updatePaymentIntent(commandeId, paymentIntentId);
  }

  /**
   * Mettre à jour une commande (mise à jour dynamique)
   */
  async update(commandeId: string, data: UpdateCommandeData): Promise<boolean> {
    return this.writeRepo.update(commandeId, data);
  }

  /**
   * Supprimer une commande
   */
  async delete(commandeId: string): Promise<boolean> {
    return this.writeRepo.delete(commandeId);
  }

  /**
   * Supprimer les commandes d'un utilisateur (utiliser avec précaution)
   */
  async deleteByUser(utilisateurId: number): Promise<number> {
    return this.writeRepo.deleteByUser(utilisateurId);
  }

  /**
   * Supprimer les commandes annulées anciennes (nettoyage)
   */
  async deleteOldCancelled(days: number): Promise<number> {
    return this.writeRepo.deleteOldCancelled(days);
  }

  // ==========================================================================
  // MÉTHODES DE STATISTIQUES (délégation au StatsRepository)
  // ==========================================================================

  /**
   * Récupérer les statistiques des commandes
   */
  async getStatistiques(): Promise<CommandeStatistiques> {
    return this.statsRepo.getStatistiques();
  }

  /**
   * Compter les commandes par statut
   */
  async countByStatut(): Promise<Record<string, number>> {
    return this.statsRepo.countByStatut();
  }

  /**
   * Obtenir les statistiques par période
   */
  async getStatsByPeriod(
    period: "day" | "week" | "month",
    duration: number,
  ): Promise<CommandeStatsPeriode[]> {
    return this.statsRepo.getStatsByPeriod(period, duration);
  }

  /**
   * Obtenir les statistiques par année
   */
  async getStatsByYear(duration: number): Promise<CommandeStatsPeriode[]> {
    return this.statsRepo.getStatsByYear(duration);
  }

  /**
   * Obtenir les top produits vendus
   */
  async getTopProduits(limit: number = 10): Promise<TopProduit[]> {
    return this.statsRepo.getTopProduits(limit);
  }

  /**
   * Obtenir les top produits par chiffre d'affaires
   */
  async getTopProduitsByCA(limit: number = 10): Promise<TopProduit[]> {
    return this.statsRepo.getTopProduitsByCA(limit);
  }

  /**
   * Obtenir le panier moyen
   */
  async getPanierMoyen(): Promise<number> {
    return this.statsRepo.getPanierMoyen();
  }

  /**
   * Obtenir les top clients par nombre de commandes
   */
  async getTopClientsByCount(limit: number = 10): Promise<any[]> {
    return this.statsRepo.getTopClientsByCount(limit);
  }

  /**
   * Obtenir les top clients par montant dépensé
   */
  async getTopClientsByAmount(limit: number = 10): Promise<any[]> {
    return this.statsRepo.getTopClientsByAmount(limit);
  }

  /**
   * Obtenir le taux de conversion
   */
  async getTauxConversion(): Promise<any> {
    return this.statsRepo.getTauxConversion();
  }

  /**
   * Obtenir le temps moyen de traitement
   */
  async getTempsMoyenTraitement(days: number = 30): Promise<number> {
    return this.statsRepo.getTempsMoyenTraitement(days);
  }

  /**
   * Obtenir la répartition des commandes par heure
   */
  async getCommandesByHour(days: number = 30): Promise<any[]> {
    return this.statsRepo.getCommandesByHour(days);
  }

  /**
   * Obtenir la répartition des commandes par jour de la semaine
   */
  async getCommandesByDayOfWeek(days: number = 90): Promise<any[]> {
    return this.statsRepo.getCommandesByDayOfWeek(days);
  }

  // ==========================================================================
  // MÉTHODES DE RECHERCHE (délégation au SearchRepository)
  // ==========================================================================

  /**
   * Rechercher des commandes avec filtres et pagination
   */
  async search(
    filters: CommandeSearchFilters,
  ): Promise<{ commandes: Commande[]; total: number }> {
    return this.searchRepo.search(filters);
  }

  /**
   * Rechercher des commandes par ID partiel (autocomplete)
   */
  async searchByIdPattern(
    pattern: string,
    limit: number = 10,
  ): Promise<Commande[]> {
    return this.searchRepo.searchByIdPattern(pattern, limit);
  }

  /**
   * Rechercher des commandes par email utilisateur
   */
  async searchByEmail(email: string, limit: number = 50): Promise<Commande[]> {
    return this.searchRepo.searchByEmail(email, limit);
  }

  /**
   * Rechercher des commandes par nom d'utilisateur
   */
  async searchByUsername(
    username: string,
    limit: number = 50,
  ): Promise<Commande[]> {
    return this.searchRepo.searchByUsername(username, limit);
  }

  /**
   * Rechercher des commandes par plage de montants
   */
  async searchByMontantRange(
    min: number,
    max: number,
    limit: number = 100,
  ): Promise<Commande[]> {
    return this.searchRepo.searchByMontantRange(min, max, limit);
  }

  /**
   * Rechercher des commandes par article
   */
  async searchByArticle(
    articleId: string,
    limit: number = 100,
  ): Promise<Commande[]> {
    return this.searchRepo.searchByArticle(articleId, limit);
  }

  /**
   * Rechercher des commandes par nom de produit
   */
  async searchByProductName(
    productName: string,
    limit: number = 100,
  ): Promise<Commande[]> {
    return this.searchRepo.searchByProductName(productName, limit);
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION (délégation au ValidationRepository)
  // ==========================================================================

  /**
   * Vérifier si une commande existe
   */
  async exists(commandeId: string): Promise<boolean> {
    return this.validationRepo.exists(commandeId);
  }

  /**
   * Vérifier si un utilisateur existe
   */
  async userExists(utilisateurId: number): Promise<boolean> {
    return this.validationRepo.userExists(utilisateurId);
  }

  /**
   * Vérifier si un payment_intent_id existe déjà
   */
  async paymentIntentExists(paymentIntentId: string): Promise<boolean> {
    return this.validationRepo.paymentIntentExists(paymentIntentId);
  }

  /**
   * Vérifier si un utilisateur a une commande en cours
   */
  async userHasPendingCommande(utilisateurId: number): Promise<boolean> {
    return this.validationRepo.userHasPendingCommande(utilisateurId);
  }

  /**
   * Obtenir le statut d'une commande
   */
  async getCommandeStatut(commandeId: string): Promise<string | null> {
    return this.validationRepo.getCommandeStatut(commandeId);
  }

  /**
   * Vérifier si une commande peut être annulée
   */
  async canBeCancelled(commandeId: string): Promise<boolean> {
    return this.validationRepo.canBeCancelled(commandeId);
  }

  /**
   * Vérifier si une commande peut être modifiée
   */
  async canBeModified(commandeId: string): Promise<boolean> {
    return this.validationRepo.canBeModified(commandeId);
  }

  /**
   * Vérifier si une commande peut être remboursée
   */
  async canBeRefunded(commandeId: string): Promise<boolean> {
    return this.validationRepo.canBeRefunded(commandeId);
  }

  /**
   * Compter les commandes récentes d'un utilisateur
   */
  async countRecentUserCommandes(
    utilisateurId: number,
    minutes: number,
  ): Promise<number> {
    return this.validationRepo.countRecentUserCommandes(utilisateurId, minutes);
  }

  /**
   * Calculer le total des commandes récentes d'un utilisateur
   */
  async sumRecentUserCommandesTotal(
    utilisateurId: number,
    minutes: number,
  ): Promise<number> {
    return this.validationRepo.sumRecentUserCommandesTotal(
      utilisateurId,
      minutes,
    );
  }

  /**
   * Vérifier si un utilisateur dépasse la limite de commandes
   */
  async userExceedsOrderLimit(
    utilisateurId: number,
    hours: number,
    limit: number,
  ): Promise<boolean> {
    return this.validationRepo.userExceedsOrderLimit(
      utilisateurId,
      hours,
      limit,
    );
  }

  /**
   * Vérifier si un utilisateur a trop de commandes annulées
   */
  async userHasTooManyCancelled(
    utilisateurId: number,
    days: number,
    tauxMax: number,
  ): Promise<{ hasTooMany: boolean; stats: any }> {
    return this.validationRepo.userHasTooManyCancelled(
      utilisateurId,
      days,
      tauxMax,
    );
  }

  /**
   * Détecter les tentatives de commandes multiples avec le même payment_intent
   */
  async checkDuplicatePaymentIntent(
    paymentIntentId: string,
  ): Promise<{ hasDuplicate: boolean; commandeIds: string[] }> {
    return this.validationRepo.checkDuplicatePaymentIntent(paymentIntentId);
  }

  /**
   * Vérifier si un utilisateur peut commander
   */
  async userCanOrder(utilisateurId: number): Promise<boolean> {
    return this.validationRepo.userCanOrder(utilisateurId);
  }

  /**
   * Vérifier la cohérence du total d'une commande
   */
  async checkCommandeTotalConsistency(
    commandeId: string,
  ): Promise<{ isConsistent: boolean; details?: any }> {
    return this.validationRepo.checkCommandeTotalConsistency(commandeId);
  }

  /**
   * Vérifier si une commande a des articles
   */
  async commandeHasArticles(commandeId: string): Promise<boolean> {
    return this.validationRepo.commandeHasArticles(commandeId);
  }

  /**
   * Vérifier si un statut est valide
   */
  checkValidStatut(statut: string): boolean {
    return this.validationRepo.checkValidStatut(statut);
  }

  /**
   * Vérifier si une transition de statut est valide
   */
  isValidStatusTransition(currentStatut: string, newStatut: string): boolean {
    return this.validationRepo.isValidStatusTransition(
      currentStatut,
      newStatut,
    );
  }

  /**
   * Vérifier si un statut est final
   */
  isFinalStatus(statut: string): boolean {
    return this.validationRepo.isFinalStatus(statut);
  }

  /**
   * Vérifier si une commande est trop ancienne
   */
  async isCommandeTooOld(commandeId: string, hours: number): Promise<boolean> {
    return this.validationRepo.isCommandeTooOld(commandeId, hours);
  }

  /**
   * Vérifier si une commande est expirée
   */
  async isCommandeExpired(
    commandeId: string,
    hours: number = 24,
  ): Promise<boolean> {
    return this.validationRepo.isCommandeExpired(commandeId, hours);
  }

  /**
   * Obtenir les commandes expirées
   */
  async getExpiredCommandes(
    hours: number,
    limit: number = 100,
  ): Promise<any[]> {
    return this.validationRepo.getExpiredCommandes(hours, limit);
  }

  /**
   * Vérifier si un montant est valide
   */
  checkValidMontant(montant: number): boolean {
    return this.validationRepo.checkValidMontant(montant);
  }

  /**
   * Vérifier si un montant est suspect
   */
  checkSuspiciousMontant(montant: number): boolean {
    return this.validationRepo.checkSuspiciousMontant(montant);
  }

  /**
   * Obtenir le montant moyen des commandes d'un utilisateur
   */
  async getUserAverageOrderAmount(
    utilisateurId: number,
    days: number = 90,
  ): Promise<number> {
    return this.validationRepo.getUserAverageOrderAmount(utilisateurId, days);
  }

  /**
   * Vérifier si un montant dévie trop de la moyenne
   */
  async checkMontantDeviation(
    utilisateurId: number,
    montant: number,
    days: number = 90,
  ): Promise<{ hasDeviation: boolean; stats?: any }> {
    return this.validationRepo.checkMontantDeviation(
      utilisateurId,
      montant,
      days,
    );
  }

  /**
   * Vérifier l'intégrité référentielle
   */
  async checkReferentialIntegrity(commandeId: string): Promise<boolean> {
    return this.validationRepo.checkReferentialIntegrity(commandeId);
  }

  /**
   * Obtenir les commandes orphelines
   */
  async getOrphanedCommandes(limit: number = 100): Promise<any[]> {
    return this.validationRepo.getOrphanedCommandes(limit);
  }

  /**
   * Vérifier les doublons potentiels
   */
  async checkPotentialDuplicates(
    commandeId: string,
  ): Promise<{ hasDuplicates: boolean; duplicates: any[] }> {
    return this.validationRepo.checkPotentialDuplicates(commandeId);
  }

  // ==========================================================================
  // ACCESSEURS POUR LES REPOSITORIES SPÉCIALISÉS
  // ==========================================================================

  /**
   * Accéder directement au repository de lecture
   */
  get read(): CommandesReadRepository {
    return this.readRepo;
  }

  /**
   * Accéder directement au repository d'écriture
   */
  get write(): CommandesWriteRepository {
    return this.writeRepo;
  }

  /**
   * Accéder directement au repository de statistiques
   */
  get stats(): CommandesStatsRepository {
    return this.statsRepo;
  }

  /**
   * Accéder directement au repository de recherche
   */
  get searchRepository(): CommandesSearchRepository {
    return this.searchRepo;
  }

  /**
   * Accéder directement au repository de validation
   */
  get validation(): CommandesValidationRepository {
    return this.validationRepo;
  }
}

// Singleton instance
let repositoryInstance: CommandesRepository | null = null;

/**
 * Obtenir l'instance singleton du repository
 */
export function getCommandesRepository(): CommandesRepository {
  if (!repositoryInstance) {
    repositoryInstance = new CommandesRepository();
  }
  return repositoryInstance;
}
