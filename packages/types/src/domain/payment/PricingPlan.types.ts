/**
 * Domain Types - PricingPlan
 * Basé sur la table `plans_tarifaires` de la DB
 */

/**
 * Interface principale PricingPlan
 * Correspond à la structure de la table `plans_tarifaires`
 */
export interface PricingPlan {
  // Identifiants
  id: number;

  // Informations du plan
  nom: string; // VARCHAR(100)
  description?: string | null; // TEXT
  prix: number; // DECIMAL(10,2)
  duree_mois: number; // INT, default 1

  // Statut
  actif: boolean; // BOOLEAN, default true

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * PricingPlan avec relations et données calculées
 */
export interface PricingPlanWithRelations extends PricingPlan {
  // Statistiques calculées
  nombre_abonnes?: number; // Nombre d'utilisateurs actifs avec ce plan
  revenue_total?: number; // Revenu total généré par ce plan
  nombre_echeances_actives?: number; // Nombre d'échéances en attente
  nombre_paiements?: number; // Nombre total de paiements
}

/**
 * PricingPlan pour l'affichage public
 */
export interface PricingPlanPublic {
  id: number;
  nom: string;
  description?: string | null;
  prix: number;
  duree_mois: number;
  actif: boolean;
}

/**
 * PricingPlan minimal (pour références)
 */
export interface PricingPlanBasic {
  id: number;
  nom: string;
  prix: number;
  duree_mois: number;
  actif: boolean;
}

/**
 * PricingPlan pour liste/tableau
 */
export interface PricingPlanListItem {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  duree_mois: number;
  actif: boolean;
  nombre_abonnes?: number;
  revenue_total?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * PricingPlan avec détails complets pour l'affichage
 */
export interface PricingPlanDetail extends PricingPlanWithRelations {
  prix_formatted: string; // Ex: "50,00 €"
  prix_mensuel: number; // Prix divisé par duree_mois
  prix_mensuel_formatted: string; // Ex: "25,00 €/mois"
  duree_label: string; // Ex: "3 mois", "1 an"
}

/**
 * PricingPlan pour sélection (ex: formulaires)
 */
export interface PricingPlanOption {
  id: number;
  nom: string;
  prix: number;
  duree_mois: number;
  description?: string;
  prix_formatted: string;
  est_populaire?: boolean; // Flag pour mise en évidence
}

/**
 * PricingPlan pour affichage carte de tarification
 */
export interface PricingPlanCard {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  duree_mois: number;
  prix_mensuel: number;
  actif: boolean;
  caracteristiques?: string[]; // Liste de features/avantages
  est_populaire?: boolean;
  est_recommande?: boolean;
}

/**
 * Statistiques d'un plan tarifaire
 */
export interface PricingPlanStats {
  plan_id: number;
  plan_nom: string;
  nombre_abonnes_actifs: number;
  nombre_total_abonnes: number; // Historique
  revenue_total: number;
  revenue_mois_en_cours: number;
  nombre_paiements_total: number;
  nombre_echeances_en_attente: number;
  montant_echeances_en_attente: number;
  taux_conversion?: number; // Pourcentage (0-100)
}

/**
 * Comparaison de plans tarifaires
 */
export interface PricingPlanComparison {
  plans: PricingPlanCard[];
  caracteristiques_communes: string[];
  meilleur_rapport_qualite_prix?: number; // ID du plan
}

/**
 * Historique des modifications d'un plan
 */
export interface PricingPlanHistory {
  plan_id: number;
  plan_nom: string;
  changements: {
    date: Date;
    champ_modifie: string;
    ancienne_valeur: string | number | boolean;
    nouvelle_valeur: string | number | boolean;
  }[];
}

/**
 * Données pour créer un plan tarifaire
 */
export interface CreatePricingPlanData {
  nom: string;
  description?: string;
  prix: number;
  duree_mois?: number; // Default: 1
  actif?: boolean; // Default: true
}

/**
 * Données pour mettre à jour un plan tarifaire
 */
export interface UpdatePricingPlanData {
  nom?: string;
  description?: string;
  prix?: number;
  duree_mois?: number;
  actif?: boolean;
}

/**
 * Options de filtre pour les plans tarifaires
 */
export interface PricingPlanFilterOptions {
  actif?: boolean;
  prix_min?: number;
  prix_max?: number;
  duree_mois?: number;
  recherche?: string; // Recherche dans nom/description
}

/**
 * Labels pour les durées courantes
 */
export const DUREE_LABELS: Record<number, string> = {
  1: '1 mois',
  3: '3 mois',
  6: '6 mois',
  12: '1 an',
  24: '2 ans',
};

/**
 * Helper pour obtenir le label de durée
 */
export function getDureeLabel(duree_mois: number): string {
  if (DUREE_LABELS[duree_mois]) {
    return DUREE_LABELS[duree_mois];
  }
  return `${duree_mois} mois`;
}
