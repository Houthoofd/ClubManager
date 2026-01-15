/**
 * Types pour le module Paiements
 */

// ============================================================================
// TYPES TYPESCRIPT - ENTITÉS
// ============================================================================

/**
 * Paiement
 */
export interface Paiement {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_paiement: Date | string;
  methode_paiement: string;
  statut: string;
  stripe_payment_intent_id?: string | null;
  stripe_charge_id?: string | null;
  abonnement_id?: number | null;
  commande_id?: number | null;
  echeance_id?: number | null;
  periode_debut?: Date | string | null;
  periode_fin?: Date | string | null;
  notes?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Paiement avec détails des relations
 */
export interface PaiementAvecDetails {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_paiement: Date | string;
  methode_paiement: string;
  statut: string;
  stripe_payment_intent_id?: string | null;
  first_name: string;
  last_name: string;
  nom_plan?: string | null;
  echeance_id?: number | null;
  echeance_statut?: string | null;
  created_at?: Date | string;
}

/**
 * Échéance de paiement
 */
export interface EcheancePaiement {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_echeance: Date | string;
  statut: string;
  description?: string | null;
  abonnement_id?: number | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Échéance avec détails utilisateur
 */
export interface EcheanceAvecDetails {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_echeance: Date | string;
  statut: string;
  description?: string | null;
  utilisateur: {
    first_name: string;
    last_name: string;
  };
  abonnement_nom?: string | null;
}

/**
 * Commande
 */
export interface Commande {
  id: number;
  utilisateur_id: number;
  montant_total: number;
  statut: string;
  date_commande: Date | string;
  paiement_id?: number | null;
  notes?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Article de commande
 */
export interface ArticleCommande {
  id: number;
  commande_id: number;
  article_id: number;
  quantite: number;
  prix_unitaire: number;
  created_at?: Date | string;
}

// ============================================================================
// TYPES SQL (RAW DB ROWS)
// ============================================================================

/**
 * Row de la table paiements
 */
export interface PaiementRow {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_paiement: Date;
  methode_paiement: string;
  statut: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  abonnement_id: number | null;
  commande_id: number | null;
  echeance_id: number | null;
  periode_debut: Date | null;
  periode_fin: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row avec jointures pour paiements
 */
export interface PaiementAvecDetailsRow {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_paiement: Date;
  methode_paiement: string;
  statut: string;
  stripe_payment_intent_id: string | null;
  first_name: string;
  last_name: string;
  nom_plan: string | null;
  echeance_id: number | null;
  echeance_statut: string | null;
  created_at: Date;
}

/**
 * Row de la table echeances_paiements
 */
export interface EcheancePaiementRow {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_echeance: Date;
  statut: string;
  description: string | null;
  abonnement_id: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row avec jointures pour échéances
 */
export interface EcheanceAvecDetailsRow {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_echeance: Date;
  statut: string;
  description: string | null;
  first_name: string;
  last_name: string;
  abonnement_nom: string | null;
}

/**
 * Row de la table commandes
 */
export interface CommandeRow {
  id: number;
  utilisateur_id: number;
  montant_total: number;
  statut: string;
  date_commande: Date;
  paiement_id: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row de la table articles_commandes
 */
export interface ArticleCommandeRow {
  id: number;
  commande_id: number;
  article_id: number;
  quantite: number;
  prix_unitaire: number;
  created_at: Date;
}

// ============================================================================
// DTOs (DATA TRANSFER OBJECTS)
// ============================================================================

/**
 * Données pour créer un paiement
 */
export interface CreatePaiementData {
  utilisateur_id: number;
  montant: number;
  date_paiement?: Date | string;
  methode_paiement: string;
  statut?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  abonnement_id?: number;
  commande_id?: number;
  echeance_id?: number;
  periode_debut?: Date | string;
  periode_fin?: Date | string;
  notes?: string;
}

/**
 * Données pour modifier un paiement
 */
export interface UpdatePaiementData {
  montant?: number;
  methode_paiement?: string;
  statut?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  notes?: string;
}

/**
 * Données pour créer une échéance
 */
export interface CreateEcheanceData {
  utilisateur_id: number;
  montant: number;
  date_echeance: Date | string;
  statut?: string;
  description?: string;
  abonnement_id?: number;
}

/**
 * Données pour créer une commande
 */
export interface CreateCommandeData {
  utilisateur_id: number;
  montant_total: number;
  statut?: string;
  notes?: string;
  articles: CreateArticleCommandeData[];
}

/**
 * Données pour créer un article de commande
 */
export interface CreateArticleCommandeData {
  article_id: number;
  quantite: number;
  prix_unitaire: number;
}

/**
 * Données pour enregistrer un paiement d'échéance
 */
export interface EnregistrerPaiementEcheanceData {
  utilisateur_id: number;
  montant: number;
  methode_paiement: string;
  stripe_payment_intent_id?: string;
  abonnement_id?: number;
  periode_debut?: Date | string;
  periode_fin?: Date | string;
}

/**
 * Données pour confirmer un paiement Stripe
 */
export interface ConfirmerPaiementStripeData {
  paiementId: number;
  stripeChargeId: string;
  statut?: string;
}

// ============================================================================
// RÉSULTATS
// ============================================================================

/**
 * Résultat de confirmation d'opération
 */
export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
  [key: string]: any;
}

/**
 * Résultat de recherche
 */
export interface SearchResult<T = any> {
  isFind: boolean;
  message: string;
  data: T;
}

/**
 * Résultat de création de paiement
 */
export interface CreatePaiementResult {
  isConfirm: boolean;
  message: string;
  id?: number;
  date_paiement?: Date | string;
}

/**
 * Résultat de création de commande
 */
export interface CreateCommandeResult {
  isConfirm: boolean;
  message: string;
  commandeId?: number;
}

/**
 * Détails de paiement Stripe
 */
export interface DetailsPaiementStripe {
  paiement_id: number;
  utilisateur_id: number;
  montant: number;
  statut: string;
  echeance_id?: number | null;
  echeance_statut?: string | null;
}

/**
 * Diagnostic de paiement
 */
export interface DiagnosticPaiement {
  timestamp: string;
  paiement_en_base: boolean;
  details_paiement: any;
  problemes_detectes: string[];
  suggestions: string[];
}

/**
 * Résultat de diagnostic
 */
export interface DiagnosticResult {
  isFind: boolean;
  message: string;
  data: DiagnosticPaiement | { error: string };
}

/**
 * Résultat de vérification du premier paiement
 */
export interface PremierPaiementResult {
  isPremier: boolean;
  count: number;
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Statuts de paiement
 */
export enum StatutPaiement {
  EN_ATTENTE = "en_attente",
  VALIDE = "valide",
  REFUSE = "refuse",
  ANNULE = "annule",
  REMBOURSE = "rembourse",
}

/**
 * Statuts d'échéance
 */
export enum StatutEcheance {
  EN_ATTENTE = "en_attente",
  PAYEE = "payee",
  EN_RETARD = "en_retard",
  ANNULEE = "annulee",
}

/**
 * Méthodes de paiement
 */
export enum MethodePaiement {
  CARTE = "carte",
  VIREMENT = "virement",
  CHEQUE = "cheque",
  ESPECES = "especes",
  STRIPE = "stripe",
  PAYPAL = "paypal",
}

/**
 * Statuts de commande
 */
export enum StatutCommande {
  EN_ATTENTE = "en_attente",
  CONFIRMEE = "confirmee",
  EN_PREPARATION = "en_preparation",
  EXPEDIEE = "expediee",
  LIVREE = "livree",
  ANNULEE = "annulee",
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Vérifie si un paiement est valide
 */
export function isValidPaiement(paiement: any): paiement is Paiement {
  return (
    paiement &&
    typeof paiement.id === "number" &&
    typeof paiement.utilisateur_id === "number" &&
    typeof paiement.montant === "number" &&
    typeof paiement.methode_paiement === "string" &&
    typeof paiement.statut === "string"
  );
}

/**
 * Vérifie si une échéance est valide
 */
export function isValidEcheance(echeance: any): echeance is EcheancePaiement {
  return (
    echeance &&
    typeof echeance.id === "number" &&
    typeof echeance.utilisateur_id === "number" &&
    typeof echeance.montant === "number" &&
    typeof echeance.statut === "string"
  );
}

/**
 * Vérifie si un statut de paiement est valide
 */
export function isValidStatutPaiement(statut: any): statut is StatutPaiement {
  return Object.values(StatutPaiement).includes(statut);
}

/**
 * Vérifie si un statut d'échéance est valide
 */
export function isValidStatutEcheance(statut: any): statut is StatutEcheance {
  return Object.values(StatutEcheance).includes(statut);
}

/**
 * Vérifie si une méthode de paiement est valide
 */
export function isValidMethodePaiement(
  methode: any,
): methode is MethodePaiement {
  return Object.values(MethodePaiement).includes(methode);
}

/**
 * Vérifie si un montant est valide
 */
export function isValidMontant(montant: number): boolean {
  return typeof montant === "number" && montant > 0 && !isNaN(montant);
}

/**
 * Vérifie si une date est valide
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Champs pouvant être mis à jour pour un paiement
 */
export type UpdatablePaiementFields =
  | "montant"
  | "methode_paiement"
  | "statut"
  | "stripe_payment_intent_id"
  | "stripe_charge_id"
  | "notes";

/**
 * Champs pouvant être mis à jour pour une échéance
 */
export type UpdatableEcheanceFields =
  | "montant"
  | "date_echeance"
  | "statut"
  | "description";

/**
 * Options de filtrage pour les paiements
 */
export interface PaiementFilterOptions {
  utilisateurId?: number;
  statut?: string;
  methodePaiement?: string;
  dateDebut?: Date | string;
  dateFin?: Date | string;
  abonnementId?: number;
  limit?: number;
  offset?: number;
}

/**
 * Options de filtrage pour les échéances
 */
export interface EcheanceFilterOptions {
  utilisateurId?: number;
  statut?: string;
  dateDebut?: Date | string;
  dateFin?: Date | string;
  abonnementId?: number;
  limit?: number;
  offset?: number;
}

/**
 * Données utilisateur pour contexte
 */
export interface UserData {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  status_id?: number;
  [key: string]: any;
}

/**
 * Résultat de vérification avec données
 */
export interface VerifyResultWithData {
  isFind: boolean;
  message: string;
  data: any;
}

/**
 * Statistiques de paiements
 */
export interface StatistiquesPaiements {
  total_paiements: number;
  montant_total: number;
  paiements_par_statut: {
    [key: string]: number;
  };
  paiements_par_methode: {
    [key: string]: number;
  };
  moyenne_montant: number;
}

/**
 * Statistiques d'échéances
 */
export interface StatistiquesEcheances {
  total_echeances: number;
  montant_total: number;
  echeances_payees: number;
  echeances_en_attente: number;
  echeances_en_retard: number;
  montant_restant: number;
}
