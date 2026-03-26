/**
 * DTOs Payment pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer un paiement
 */
export interface CreatePaymentDto {
  utilisateur_id: number;
  montant: number;
  methode_paiement: string; // Ex: "carte", "especes", "virement", "stripe"
  plan_tarifaire_id?: number; // Référence au plan tarifaire (optionnel)
  description?: string;
}

/**
 * DTO pour mettre à jour un paiement
 */
export interface UpdatePaymentDto {
  id: number;
  statut?: string; // Ex: "en_attente", "complete", "echoue", "rembourse"
  description?: string;
}

/**
 * DTO pour la réponse Payment
 */
export interface PaymentResponseDto {
  id: number;
  utilisateur_id: number;
  montant: number;
  montant_formate: string; // Ex: "50,00 €"
  methode_paiement: string;
  statut: string;
  description?: string;
  date_paiement: string; // ISO 8601

  // Relation avec l'utilisateur
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
    email?: string;
    telephone?: string;
    photo_url?: string;
  };

  // Relation avec le plan tarifaire
  plan_tarifaire?: {
    id: number;
    nom: string;
    description?: string;
    prix: number;
    prix_formate: string;
    duree_mois: number;
  };

  // Informations Stripe (si applicable)
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;

  created_at: string; // ISO 8601
  updated_at?: string;
}

/**
 * DTO pour liste de paiements (simplifié)
 */
export interface PaymentListItemDto {
  id: number;
  utilisateur_id: number;
  utilisateur_nom_complet: string;
  montant: number;
  montant_formate: string;
  methode_paiement: string;
  statut: string;
  date_paiement: string; // ISO 8601
  plan_tarifaire_nom?: string;
  description?: string;
}

/**
 * DTO pour rembourser un paiement
 */
export interface RefundPaymentDto {
  id: number;
  raison: string;
  montant_rembourse: number; // Peut être partiel ou total
}

/**
 * DTO pour recherche/filtre de paiements
 */
export interface SearchPaymentDto {
  utilisateur_id?: number;
  date_debut?: string; // Format YYYY-MM-DD
  date_fin?: string; // Format YYYY-MM-DD
  statut?: string;
  methode_paiement?: string;
  plan_tarifaire_id?: number;
  montant_min?: number;
  montant_max?: number;
}

/**
 * DTO pour statistiques de paiements
 */
export interface PaymentStatsDto {
  total_paiements: number;
  montant_total: number;
  montant_total_formate: string;

  // Statistiques par méthode de paiement
  par_methode: {
    methode: string;
    count: number;
    montant_total: number;
    montant_formate: string;
  }[];

  // Statistiques par statut
  par_statut: {
    statut: string;
    count: number;
    montant_total: number;
    montant_formate: string;
  }[];

  // Revenue
  revenue_mois_courant: number;
  revenue_mois_courant_formate: string;
  revenue_annee_courante: number;
  revenue_annee_courante_formate: string;

  // Moyenne
  montant_moyen: number;
  montant_moyen_formate: string;

  // Tendances
  evolution_mensuelle?: {
    mois: string; // Format YYYY-MM
    count: number;
    montant_total: number;
  }[];
}

/**
 * DTO pour création d'un Payment Intent Stripe
 */
export interface StripePaymentIntentDto {
  payment_intent_id: string;
  amount: number; // Montant en centimes
  currency: string; // Ex: "eur"
  client_secret: string;
  status: string;
}
