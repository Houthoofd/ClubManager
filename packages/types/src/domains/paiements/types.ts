/**
 * Types pour le service Paiements
 * Gestion des paiements, abonnements et échéances
 * Les schémas Zod et enums sont dans validators.ts
 *
 * @module paiements/types
 */

// ============================================================================
// PAYMENT METHOD TYPES (Nouvelle table de référence - Phase 1)
// ============================================================================

/**
 * Méthode de paiement (table de référence)
 */
export interface PaymentMethod {
  /** Identifiant unique */
  id: number;

  /** Code unique de la méthode (STRIPE, PAYPAL, BITCOIN, etc.) */
  code: string;

  /** Nom de la méthode de paiement */
  name: string;

  /** La méthode est-elle active ? */
  active: boolean;

  /** Date de création */
  created_at: Date;
}

/**
 * Données pour créer une méthode de paiement
 */
export interface CreatePaymentMethodInput {
  code: string;
  name: string;
  active?: boolean;
}

/**
 * Données pour mettre à jour une méthode de paiement
 */
export interface UpdatePaymentMethodInput {
  code?: string;
  name?: string;
  active?: boolean;
}

// ============================================================================
// PAYMENT ENUMS
// ============================================================================

/**
 * Statut d'un paiement
 */
export enum StatutPaiement {
  EN_ATTENTE = "en attente",
  VALIDE = "validé",
  REFUSE = "refusé",
  REMBOURSE = "remboursé",
  ANNULE = "annulé",
}

/**
 * Statut d'une échéance de paiement
 */
export enum StatutEcheance {
  PAYE = "payé",
  EN_ATTENTE = "en attente",
  ECHU = "échu",
}

/**
 * Méthode de paiement
 */
export enum MethodePaiement {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  BITCOIN = "bitcoin",
  VIREMENT = "virement",
  AUTRE = "autre",
}

/**
 * Type Paiement
 */
export type Paiement = {
  id: number;
  commande_id: number | null;
  utilisateur_id: number;
  montant: number;
  methode_paiement: MethodePaiement | null; // DEPRECATED: Utiliser payment_method_id
  payment_method_id: number; // Nouvelle FK vers PaymentMethod
  stripe_payment_intent_id: string | null;
  paypal_order_id: string | null;
  bitcoin_address: string | null;
  date_paiement: Date;
  statut: StatutPaiement;
  description: string | null;
  date_confirmation: Date | null;
  date_modification: Date | null;
  abonnement_id: number | null;
  periode_debut: Date | null;
  periode_fin: Date | null;
};

/**
 * Paiement avec informations utilisateur, commande et abonnement
 */
export interface PaiementAvecDetails extends Paiement {
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  commande?: {
    id: number;
    numero_commande: string;
    montant_total: number;
    statut: string;
  };
  abonnement?: {
    id: number;
    nom: string;
    montant: number;
    frequence: string;
  };
  payment_method?: PaymentMethod;
}

/**
 * Type EcheancePaiement
 */
export type EcheancePaiement = {
  id: number;
  utilisateur_id: number;
  abonnement_id: number;
  date_echeance: Date;
  montant: number;
  statut: StatutEcheance;
  date_paiement: Date | null;
};

/**
 * Échéance avec informations utilisateur et abonnement
 */
export interface EcheanceAvecDetails extends EcheancePaiement {
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  abonnement?: {
    id: number;
    nom: string;
    montant: number;
    frequence: string;
  };
}

/**
 * Input pour créer un paiement
 */
export type CreerPaiementInput = {
  commandeId?: number;
  utilisateurId: number;
  montant: number;
  methodePaiement?: MethodePaiement;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  bitcoinAddress?: string;
  datePaiement: Date;
  description?: string;
  abonnementId?: number;
  periodeDebut?: Date;
  periodeFin?: Date;
};

/**
 * Input pour valider un paiement
 */
export type ValiderPaiementInput = {
  paiementId: number;
  referenceTransaction?: string;
};

/**
 * Statistiques des paiements
 */
export interface StatistiquesPaiements {
  totalPaiements: number;
  montantTotal: number;
  paiementsValides: number;
  paiementsEnAttente: number;
  paiementsRefuses: number;
  paiementsRembourses: number;
  paiementsAnnules: number;
  moyenneMontant: number;
  montantParMois?: Array<{
    mois: string;
    montant: number;
    count: number;
  }>;
  repartitionMethodes?: Array<{
    methode: MethodePaiement;
    count: number;
    montantTotal: number;
  }>;
}

/**
 * Statistiques par utilisateur
 */
export interface StatistiquesPaiementsUtilisateur {
  utilisateurId: number;
  totalPaiements: number;
  montantTotal: number;
  dernierPaiement: Date | null;
  paiementsEnRetard: number;
  moyenneMontant: number;
}

/**
 * Réponse de paiement
 */
export interface PaiementsResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Erreur personnalisée pour les paiements
 */
export class PaiementsError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PaiementsError";
    this.code = code;
    Object.setPrototypeOf(this, PaiementsError.prototype);
  }
}

/**
 * Options de filtrage pour les paiements
 */
export interface PaiementsFiltres {
  utilisateurId?: number;
  statut?: StatutPaiement;
  dateDebut?: Date;
  dateFin?: Date;
  abonnementId?: number;
  montantMin?: number;
  montantMax?: number;
  limit?: number;
  offset?: number;
}

/**
 * Résultat de traitement de paiement
 */
export interface TraitementPaiementResult {
  success: boolean;
  paiementId?: number;
  statut: StatutPaiement;
  message: string;
  referenceTransaction?: string;
  montant?: number;
}
