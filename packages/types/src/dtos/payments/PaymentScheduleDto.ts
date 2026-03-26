/**
 * DTOs Payment Schedule pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer un échéancier de paiement
 */
export interface CreatePaymentScheduleDto {
  utilisateur_id: number;
  plan_tarifaire_id: number;
  montant: number;
  date_echeance: string; // Format YYYY-MM-DD
  statut?: string; // Default: "en_attente" (ex: "en_attente", "paye", "en_retard", "annule")
  description?: string;
}

/**
 * DTO pour mettre à jour un échéancier de paiement
 */
export interface UpdatePaymentScheduleDto {
  id: number;
  statut?: string;
  paiement_id?: number; // Lien vers le paiement effectué
  date_echeance?: string; // Format YYYY-MM-DD
  montant?: number;
  description?: string;
}

/**
 * DTO pour la réponse Payment Schedule
 */
export interface PaymentScheduleResponseDto {
  id: number;
  utilisateur_id: number;
  plan_tarifaire_id: number;
  montant: number;
  montant_formate: string; // Ex: "50,00 €"
  date_echeance: string; // ISO 8601
  statut: string;
  description?: string;
  paiement_id?: number;

  // Calculs
  is_overdue: boolean; // Si date_echeance passée et statut != "paye"
  jours_retard?: number; // Nombre de jours de retard

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
  plan_tarifaire: {
    id: number;
    nom: string;
    description?: string;
    prix: number;
    prix_formate: string;
    duree_mois: number;
  };

  // Relation avec le paiement (si payé)
  paiement?: {
    id: number;
    montant: number;
    methode_paiement: string;
    date_paiement: string; // ISO 8601
    statut: string;
  };

  created_at: string; // ISO 8601
  updated_at?: string;
}

/**
 * DTO pour liste d'échéanciers (simplifié)
 */
export interface PaymentScheduleListItemDto {
  id: number;
  utilisateur_id: number;
  utilisateur_nom_complet: string;
  plan_tarifaire_nom: string;
  montant: number;
  montant_formate: string;
  date_echeance: string; // ISO 8601
  statut: string;
  is_overdue: boolean;
  jours_retard?: number;
  paiement_id?: number;
  description?: string;
}

/**
 * DTO pour créer plusieurs échéanciers en masse
 */
export interface BulkCreatePaymentScheduleDto {
  utilisateur_id: number;
  plan_tarifaire_id: number;
  date_debut: string; // Format YYYY-MM-DD
  nombre_echeances: number; // Nombre d'échéances à générer
  montant_par_echeance: number;
  frequence?: string; // Ex: "mensuel", "trimestriel" (default: "mensuel")
  description?: string;
}

/**
 * DTO pour recherche/filtre d'échéanciers
 */
export interface SearchPaymentScheduleDto {
  utilisateur_id?: number;
  plan_tarifaire_id?: number;
  date_debut?: string; // Format YYYY-MM-DD
  date_fin?: string; // Format YYYY-MM-DD
  statut?: string;
  is_overdue?: boolean;
  paye?: boolean; // true = statut "paye", false = autres statuts
  montant_min?: number;
  montant_max?: number;
}

/**
 * DTO pour les échéanciers en retard
 */
export interface OverdueSchedulesDto {
  total_en_retard: number;
  montant_total_en_retard: number;
  montant_total_formate: string;

  schedules: {
    id: number;
    utilisateur_id: number;
    utilisateur_nom_complet: string;
    utilisateur_email?: string;
    utilisateur_telephone?: string;
    montant: number;
    montant_formate: string;
    date_echeance: string; // ISO 8601
    jours_retard: number;
    plan_tarifaire_nom: string;
    description?: string;
  }[];

  // Regroupement par utilisateur
  par_utilisateur: {
    utilisateur_id: number;
    utilisateur_nom_complet: string;
    nombre_echeances: number;
    montant_total: number;
    montant_total_formate: string;
  }[];
}

/**
 * DTO pour marquer un échéancier comme payé
 */
export interface MarkAsPaidDto {
  id: number;
  paiement_id: number; // ID du paiement associé
  date_paiement?: string; // Format YYYY-MM-DD (optionnel, par défaut aujourd'hui)
}

/**
 * DTO pour statistiques d'échéanciers
 */
export interface PaymentScheduleStatsDto {
  total_schedules: number;

  // Par statut
  par_statut: {
    statut: string;
    count: number;
    montant_total: number;
    montant_formate: string;
  }[];

  // En retard
  nombre_en_retard: number;
  montant_en_retard: number;
  montant_en_retard_formate: string;

  // À venir (prochains 30 jours)
  nombre_a_venir: number;
  montant_a_venir: number;
  montant_a_venir_formate: string;

  // Taux de paiement
  taux_paiement: number; // Pourcentage d'échéances payées

  // Délai moyen de paiement
  delai_moyen_jours?: number; // Nombre de jours entre échéance et paiement effectif
}
