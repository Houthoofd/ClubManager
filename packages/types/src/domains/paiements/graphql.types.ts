/**
 * Types GraphQL pour Paiements (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module paiements/graphql.types
 */

/**
 * Statut d'un paiement (GraphQL)
 */
export enum StatutPaiement {
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  REFUSE = 'refuse',
  REMBOURSE = 'rembourse',
  ANNULE = 'annule',
}

/**
 * Statut d'une échéance (GraphQL)
 */
export enum StatutEcheance {
  PAYE = 'paye',
  EN_ATTENTE = 'en_attente',
  ECHU = 'echu',
}

/**
 * Méthode de paiement (GraphQL)
 */
export enum MethodePaiement {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BITCOIN = 'bitcoin',
  VIREMENT = 'virement',
  AUTRE = 'autre',
}

/**
 * Paiement (GraphQL)
 */
export interface Paiement {
  id: number;
  commandeId?: number;
  utilisateurId: number;
  montant: number;
  methodePaiement?: MethodePaiement;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  bitcoinAddress?: string;
  datePaiement: string;
  statut: StatutPaiement;
  description?: string;
  dateConfirmation?: string;
  dateModification?: string;
  abonnementId?: number;
  periodeDebut?: string;
  periodeFin?: string;
}

/**
 * Paiement avec détails (GraphQL)
 */
export interface PaiementAvecDetails {
  id: number;
  commandeId?: number;
  utilisateurId: number;
  utilisateurNom?: string;
  utilisateurPrenom?: string;
  utilisateurEmail?: string;
  montant: number;
  methodePaiement?: MethodePaiement;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  bitcoinAddress?: string;
  datePaiement: string;
  statut: StatutPaiement;
  description?: string;
  dateConfirmation?: string;
  dateModification?: string;
  abonnementId?: number;
  abonnementNom?: string;
  periodeDebut?: string;
  periodeFin?: string;
}

/**
 * Échéance de paiement (GraphQL)
 */
export interface EcheancePaiement {
  id: number;
  utilisateurId: number;
  abonnementId: number;
  dateEcheance: string;
  montant: number;
  statut: StatutEcheance;
  datePaiement?: string;
}

/**
 * Échéance avec détails (GraphQL)
 */
export interface EcheanceAvecDetails {
  id: number;
  utilisateurId: number;
  utilisateurNom?: string;
  utilisateurPrenom?: string;
  utilisateurEmail?: string;
  abonnementId: number;
  abonnementNom?: string;
  dateEcheance: string;
  montant: number;
  statut: StatutEcheance;
  datePaiement?: string;
}

/**
 * Résultat de création de Payment Intent (GraphQL)
 */
export interface CreatePaymentIntentResult {
  success: boolean;
  message: string;
  clientSecret?: string;
  paymentIntentId?: string;
}

/**
 * Résultat de confirmation de paiement (GraphQL)
 */
export interface ConfirmPaymentResult {
  success: boolean;
  message: string;
  paiement?: Paiement;
}

/**
 * Résultat d'une opération sur paiement (GraphQL)
 */
export interface PaiementOperationResult {
  success: boolean;
  message: string;
  paiement?: Paiement;
}

/**
 * Statistiques des paiements (GraphQL)
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
  montantParMois?: MontantParMois[];
  repartitionMethodes?: RepartitionMethode[];
}

/**
 * Montant par mois (GraphQL)
 */
export interface MontantParMois {
  mois: string;
  montant: number;
  count: number;
}

/**
 * Répartition par méthode (GraphQL)
 */
export interface RepartitionMethode {
  methode: MethodePaiement;
  count: number;
  montantTotal: number;
}

/**
 * Statistiques paiements utilisateur (GraphQL)
 */
export interface StatistiquesPaiementsUtilisateur {
  utilisateurId: number;
  totalPaiements: number;
  montantTotal: number;
  dernierPaiement?: string;
  paiementsEnRetard: number;
  moyenneMontant: number;
}

/**
 * Input pour créer un Payment Intent pour échéance (GraphQL)
 */
export interface CreatePaymentIntentEcheanceInput {
  echeanceId: number;
  userId: number;
  amount: number;
  currency?: string;
  description?: string;
}

/**
 * Input pour créer un Payment Intent pour commande (GraphQL)
 */
export interface CreatePaymentIntentCommandeInput {
  commandeId: number;
  userId: number;
  amount: number;
  currency?: string;
  description?: string;
}

/**
 * Input pour confirmer un paiement d'échéance (GraphQL)
 */
export interface ConfirmEcheancePaymentInput {
  paymentIntentId: string;
  echeanceId: number;
  userId: number;
  amount: number;
}

/**
 * Input pour confirmer un paiement de commande (GraphQL)
 */
export interface ConfirmCommandePaymentInput {
  paymentIntentId: string;
  commandeId: number;
  userId: number;
  amount: number;
}

/**
 * Input pour créer un paiement manuel (GraphQL)
 */
export interface CreerPaiementInput {
  commandeId?: number;
  utilisateurId: number;
  montant: number;
  methodePaiement?: MethodePaiement;
  description?: string;
  abonnementId?: number;
}

/**
 * Input pour valider un paiement (GraphQL)
 */
export interface ValiderPaiementInput {
  paiementId: number;
  referenceTransaction?: string;
}

/**
 * Input pour refuser un paiement (GraphQL)
 */
export interface RefuserPaiementInput {
  paiementId: number;
  raison?: string;
}

/**
 * Input pour rembourser un paiement (GraphQL)
 */
export interface RembourserPaiementInput {
  paiementId: number;
  montant?: number;
  raison?: string;
}

/**
 * Input pour annuler un paiement (GraphQL)
 */
export interface AnnulerPaiementInput {
  paiementId: number;
  raison?: string;
}

/**
 * Filtres pour recherche de paiements (GraphQL)
 */
export interface PaiementsFiltres {
  utilisateurId?: number;
  statut?: StatutPaiement;
  dateDebut?: string;
  dateFin?: string;
  abonnementId?: number;
  montantMin?: number;
  montantMax?: number;
  limit?: number;
  offset?: number;
}

/**
 * Résultat de liste de paiements (GraphQL)
 */
export interface PaiementsListResult {
  paiements: PaiementAvecDetails[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Résultat de liste d'échéances (GraphQL)
 */
export interface EcheancesListResult {
  echeances: EcheanceAvecDetails[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Contexte GraphQL pour Paiements
 */
export interface PaiementsContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
