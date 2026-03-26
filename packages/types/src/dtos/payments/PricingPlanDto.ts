/**
 * DTOs Pricing Plan pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer un plan tarifaire
 */
export interface CreatePricingPlanDto {
  nom: string;
  description?: string;
  prix: number;
  duree_mois: number; // Durée en mois (ex: 1, 3, 6, 12)
  actif?: boolean; // Default: true
  couleur?: string; // Couleur pour affichage (ex: "#FF5733")
  ordre?: number; // Ordre d'affichage
  features?: string[]; // Liste des fonctionnalités incluses
}

/**
 * DTO pour mettre à jour un plan tarifaire
 */
export interface UpdatePricingPlanDto {
  id: number;
  nom?: string;
  description?: string;
  prix?: number;
  duree_mois?: number;
  actif?: boolean;
  couleur?: string;
  ordre?: number;
  features?: string[];
}

/**
 * DTO pour la réponse Pricing Plan
 */
export interface PricingPlanResponseDto {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  prix_formate: string; // Ex: "50,00 €"
  duree_mois: number;
  actif: boolean;
  couleur?: string;
  ordre: number;
  features?: string[];

  // Calculs
  prix_par_mois: number; // Prix divisé par duree_mois
  prix_par_mois_formate: string;

  // Statistiques
  nombre_abonnes: number; // Nombre d'utilisateurs actuellement abonnés
  nombre_abonnes_actifs: number; // Nombre d'utilisateurs avec abonnement actif
  revenue_mensuel: number; // Revenue généré par ce plan ce mois
  revenue_mensuel_formate: string;
  revenue_total: number; // Revenue total généré par ce plan
  revenue_total_formate: string;

  // Popularité
  est_populaire?: boolean; // Si c'est le plan le plus souscrit

  created_at: string; // ISO 8601
  updated_at?: string;
}

/**
 * DTO pour liste de plans tarifaires (simplifié)
 */
export interface PricingPlanListItemDto {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  prix_formate: string;
  duree_mois: number;
  prix_par_mois: number;
  prix_par_mois_formate: string;
  actif: boolean;
  couleur?: string;
  ordre: number;
  nombre_abonnes: number;
  est_populaire?: boolean;
}

/**
 * DTO pour recherche/filtre de plans tarifaires
 */
export interface SearchPricingPlanDto {
  actif?: boolean;
  prix_min?: number;
  prix_max?: number;
  duree_mois?: number;
  nom?: string; // Recherche par nom (partielle)
}

/**
 * DTO pour statistiques de plans tarifaires
 */
export interface PricingPlanStatsDto {
  total_plans: number;
  plans_actifs: number;
  plans_inactifs: number;

  // Abonnés
  total_abonnes: number;
  abonnes_actifs: number;

  // Plans populaires
  plan_plus_populaire?: {
    id: number;
    nom: string;
    nombre_abonnes: number;
  };

  plans_par_popularite: {
    id: number;
    nom: string;
    nombre_abonnes: number;
    pourcentage: number; // Pourcentage du total
  }[];

  // Revenue
  revenue_total: number;
  revenue_total_formate: string;
  revenue_mois_courant: number;
  revenue_mois_courant_formate: string;
  revenue_annee_courante: number;
  revenue_annee_courante_formate: string;

  // Revenue par plan
  revenue_par_plan: {
    id: number;
    nom: string;
    revenue_total: number;
    revenue_formate: string;
    nombre_paiements: number;
  }[];

  // Prix moyen
  prix_moyen: number;
  prix_moyen_formate: string;

  // Tendances
  evolution_abonnes?: {
    mois: string; // Format YYYY-MM
    total_abonnes: number;
    nouveaux_abonnes: number;
  }[];
}

/**
 * DTO pour comparer des plans tarifaires
 */
export interface ComparePricingPlansDto {
  plans: {
    id: number;
    nom: string;
    prix: number;
    prix_formate: string;
    duree_mois: number;
    prix_par_mois: number;
    prix_par_mois_formate: string;
    features?: string[];
    actif: boolean;
    nombre_abonnes: number;
    est_populaire?: boolean;
  }[];

  // Recommandation
  plan_recommande_id?: number;
  raison_recommandation?: string;
}

/**
 * DTO pour activer/désactiver un plan
 */
export interface TogglePricingPlanDto {
  id: number;
  actif: boolean;
  raison?: string; // Raison de la désactivation (optionnel)
}
