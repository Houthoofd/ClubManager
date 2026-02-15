// ================================================================
// Types pour les Paiements
// ================================================================

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Données d'un paiement
 */
export interface PaiementData {
  id: number;
  utilisateur_id: number;
  montant: Decimal | number;
  devise: string;
  statut: string;
  type_paiement?: string | null;
  methode_paiement?: string | null;
  reference_externe?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_charge_id?: string | null;
  description?: string | null;
  metadata?: any;
  date_paiement?: Date | null;
  date_creation: Date;
  date_modification?: Date | null;
  echeance_id?: number | null;
  commande_id?: number | null;
  abonnement_id?: number | null;
}

/**
 * Filtres pour les paiements
 */
export interface PaiementFilters {
  utilisateur_id?: number;
  statut?: string;
  type_paiement?: string;
  methode_paiement?: string;
  date_debut?: Date | string;
  date_fin?: Date | string;
  montant_min?: number;
  montant_max?: number;
  echeance_id?: number;
  commande_id?: number;
  abonnement_id?: number;
  reference_externe?: string;
  stripe_payment_intent_id?: string;
}

/**
 * Input pour créer un paiement
 */
export interface CreatePaiementInput {
  utilisateur_id: number;
  montant: number;
  devise?: string;
  statut?: string;
  type_paiement?: string;
  methode_paiement?: string;
  reference_externe?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  description?: string;
  metadata?: any;
  echeance_id?: number;
  commande_id?: number;
  abonnement_id?: number;
}

/**
 * Input pour mettre à jour un paiement
 */
export interface UpdatePaiementInput {
  montant?: number;
  devise?: string;
  statut?: string;
  type_paiement?: string;
  methode_paiement?: string;
  reference_externe?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  description?: string;
  metadata?: any;
  date_paiement?: Date | string;
  echeance_id?: number;
  commande_id?: number;
  abonnement_id?: number;
}
