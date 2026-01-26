/**
 * Types pour le service Paiements
 * Gestion des paiements, abonnements et échéances
 */

import { z } from 'zod';

/**
 * Statut d'un paiement
 */
export enum StatutPaiement {
  EN_ATTENTE = 'en attente',
  VALIDE = 'validé',
  REFUSE = 'refusé',
  REMBOURSE = 'remboursé',
  ANNULE = 'annulé'
}

/**
 * Statut d'une échéance de paiement
 */
export enum StatutEcheance {
  PAYE = 'payé',
  EN_ATTENTE = 'en attente',
  ECHU = 'échu'
}

/**
 * Méthode de paiement
 */
export enum MethodePaiement {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BITCOIN = 'bitcoin',
  VIREMENT = 'virement',
  AUTRE = 'autre'
}

/**
 * Schéma Zod pour validation d'un paiement
 */
export const PaiementSchema = z.object({
  id: z.number().int().positive(),
  commande_id: z.number().int().positive().nullable(),
  utilisateur_id: z.number().int().positive(),
  montant: z.number().positive(),
  methode_paiement: z.nativeEnum(MethodePaiement).nullable(),
  stripe_payment_intent_id: z.string().nullable(),
  paypal_order_id: z.string().nullable(),
  bitcoin_address: z.string().nullable(),
  date_paiement: z.date(),
  statut: z.nativeEnum(StatutPaiement),
  description: z.string().nullable(),
  date_confirmation: z.date().nullable(),
  date_modification: z.date().nullable(),
  abonnement_id: z.number().int().positive().nullable(),
  periode_debut: z.date().nullable(),
  periode_fin: z.date().nullable()
});

/**
 * Type Paiement
 */
export type Paiement = z.infer<typeof PaiementSchema>;

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
}

/**
 * Schéma Zod pour validation d'une échéance de paiement
 */
export const EcheancePaiementSchema = z.object({
  id: z.number().int().positive(),
  utilisateur_id: z.number().int().positive(),
  abonnement_id: z.number().int().positive(),
  date_echeance: z.date(),
  montant: z.number().positive(),
  statut: z.nativeEnum(StatutEcheance),
  date_paiement: z.date().nullable()
});

/**
 * Type EcheancePaiement
 */
export type EcheancePaiement = z.infer<typeof EcheancePaiementSchema>;

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
export const CreerPaiementInputSchema = z.object({
  commandeId: z.number().int().positive().optional(),
  utilisateurId: z.number().int().positive('ID utilisateur requis'),
  montant: z.number().positive('Montant doit être positif').max(999999.99, 'Montant trop élevé'),
  methodePaiement: z.nativeEnum(MethodePaiement).optional(),
  stripePaymentIntentId: z.string().optional(),
  paypalOrderId: z.string().optional(),
  bitcoinAddress: z.string().optional(),
  datePaiement: z.date(),
  description: z.string().optional(),
  abonnementId: z.number().int().positive().optional(),
  periodeDebut: z.date().optional(),
  periodeFin: z.date().optional()
});

export type CreerPaiementInput = z.infer<typeof CreerPaiementInputSchema>;

/**
 * Input pour valider un paiement
 */
export const ValiderPaiementInputSchema = z.object({
  paiementId: z.number().int().positive('ID paiement requis'),
  referenceTransaction: z.string().optional()
});

export type ValiderPaiementInput = z.infer<typeof ValiderPaiementInputSchema>;

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
    this.name = 'PaiementsError';
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
