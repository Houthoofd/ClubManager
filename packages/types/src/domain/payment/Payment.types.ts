/**
 * Domain Types - Payment
 * Basé sur la table `paiements` de la DB
 */

/**
 * Enum pour les méthodes de paiement
 */
export enum PaymentMethod {
  STRIPE = 'stripe',
  ESPECES = 'especes',
  VIREMENT = 'virement',
  AUTRE = 'autre',
}

/**
 * Enum pour les statuts de paiement
 */
export enum PaymentStatus {
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  ECHOUE = 'echoue',
  REMBOURSE = 'rembourse',
}

/**
 * Interface principale Payment
 * Correspond à la structure de la table `paiements`
 */
export interface Payment {
  // Identifiants
  id: number;

  // Relations (Foreign Keys)
  utilisateur_id: number;
  plan_tarifaire_id?: number | null;

  // Informations du paiement
  montant: number; // DECIMAL(10,2), CHECK > 0
  methode_paiement: PaymentMethod;
  statut: PaymentStatus;
  description?: string | null; // TEXT

  // Stripe
  stripe_payment_intent_id?: string | null; // VARCHAR(255)
  stripe_charge_id?: string | null; // VARCHAR(255)

  // Dates
  date_paiement: Date; // TIMESTAMP

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * Payment avec relations chargées
 */
export interface PaymentWithRelations extends Payment {
  // Utilisateur qui a effectué le paiement
  utilisateur: {
    id: number;
    userId: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string;
  };

  // Plan tarifaire associé (optionnel)
  plan_tarifaire?: {
    id: number;
    nom: string;
    description?: string;
    prix: number;
    duree_mois: number;
    actif: boolean;
  } | null;
}

/**
 * Payment pour l'affichage public
 */
export interface PaymentPublic {
  id: number;
  utilisateur_id: number;
  montant: number;
  methode_paiement: PaymentMethod;
  statut: PaymentStatus;
  description?: string | null;
  plan_tarifaire_id?: number | null;
  date_paiement: Date;
}

/**
 * Payment minimal (pour références)
 */
export interface PaymentBasic {
  id: number;
  utilisateur_id: number;
  montant: number;
  statut: PaymentStatus;
  date_paiement: Date;
}

/**
 * Payment pour liste/tableau
 */
export interface PaymentListItem {
  id: number;
  utilisateur_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_email: string;
  montant: number;
  methode_paiement: PaymentMethod;
  statut: PaymentStatus;
  plan_tarifaire_nom?: string;
  description?: string;
  date_paiement: Date;
  created_at: Date;
}

/**
 * Payment avec détails complets pour l'affichage
 */
export interface PaymentDetail extends PaymentWithRelations {
  utilisateur_nom_complet: string; // Ex: "John Doe"
  methode_paiement_label: string; // Ex: "Carte bancaire (Stripe)"
  statut_label: string; // Ex: "Validé"
  montant_formatted: string; // Ex: "50,00 €"
}

/**
 * Payment pour historique utilisateur
 */
export interface PaymentHistoryItem {
  id: number;
  montant: number;
  methode_paiement: PaymentMethod;
  statut: PaymentStatus;
  description?: string;
  plan_tarifaire_nom?: string;
  date_paiement: Date;
}

/**
 * Statistiques de paiement
 */
export interface PaymentStats {
  total_paiements: number;
  montant_total: number;
  montant_valide: number;
  montant_en_attente: number;
  montant_echoue: number;
  montant_rembourse: number;
  par_methode: {
    [key in PaymentMethod]: {
      nombre: number;
      montant: number;
    };
  };
}

/**
 * Résumé mensuel des paiements
 */
export interface PaymentMonthlySummary {
  annee: number;
  mois: number; // 1-12
  nombre_paiements: number;
  montant_total: number;
  montant_valide: number;
}

/**
 * Données pour créer un paiement
 */
export interface CreatePaymentData {
  utilisateur_id: number;
  montant: number;
  methode_paiement: PaymentMethod;
  statut?: PaymentStatus; // Default: EN_ATTENTE
  description?: string;
  plan_tarifaire_id?: number;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  date_paiement?: Date; // Default: now
}

/**
 * Données pour mettre à jour un paiement
 */
export interface UpdatePaymentData {
  montant?: number;
  methode_paiement?: PaymentMethod;
  statut?: PaymentStatus;
  description?: string;
  plan_tarifaire_id?: number;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  date_paiement?: Date;
}

/**
 * Labels des méthodes de paiement
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.STRIPE]: 'Carte bancaire (Stripe)',
  [PaymentMethod.ESPECES]: 'Espèces',
  [PaymentMethod.VIREMENT]: 'Virement bancaire',
  [PaymentMethod.AUTRE]: 'Autre',
};

/**
 * Labels des statuts de paiement
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.EN_ATTENTE]: 'En attente',
  [PaymentStatus.VALIDE]: 'Validé',
  [PaymentStatus.ECHOUE]: 'Échoué',
  [PaymentStatus.REMBOURSE]: 'Remboursé',
};
