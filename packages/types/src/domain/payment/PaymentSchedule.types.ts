/**
 * Domain Types - PaymentSchedule
 * Basé sur la table `echeances_paiements` de la DB
 */

/**
 * Enum pour les statuts d'échéance
 */
export enum ScheduleStatus {
  EN_ATTENTE = 'en_attente',
  PAYE = 'paye',
  EN_RETARD = 'en_retard',
  ANNULE = 'annule',
}

/**
 * Interface principale PaymentSchedule
 * Correspond à la structure de la table `echeances_paiements`
 */
export interface PaymentSchedule {
  // Identifiants
  id: number;

  // Relations (Foreign Keys)
  utilisateur_id: number;
  plan_tarifaire_id: number;
  paiement_id?: number | null;

  // Informations de l'échéance
  montant: number; // DECIMAL(10,2), CHECK > 0
  date_echeance: Date; // DATE
  statut: ScheduleStatus;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * PaymentSchedule avec relations chargées
 */
export interface PaymentScheduleWithRelations extends PaymentSchedule {
  // Utilisateur concerné
  utilisateur: {
    id: number;
    userId: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string;
  };

  // Plan tarifaire associé
  plan_tarifaire: {
    id: number;
    nom: string;
    description?: string;
    prix: number;
    duree_mois: number;
    actif: boolean;
  };

  // Paiement effectué (optionnel)
  paiement?: {
    id: number;
    montant: number;
    methode_paiement: string;
    statut: string;
    date_paiement: Date;
    stripe_payment_intent_id?: string;
    stripe_charge_id?: string;
  } | null;
}

/**
 * PaymentSchedule pour l'affichage public
 */
export interface PaymentSchedulePublic {
  id: number;
  utilisateur_id: number;
  plan_tarifaire_id: number;
  montant: number;
  date_echeance: Date;
  statut: ScheduleStatus;
  paiement_id?: number | null;
}

/**
 * PaymentSchedule minimal (pour références)
 */
export interface PaymentScheduleBasic {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_echeance: Date;
  statut: ScheduleStatus;
}

/**
 * PaymentSchedule pour liste/tableau
 */
export interface PaymentScheduleListItem {
  id: number;
  utilisateur_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_email: string;
  plan_tarifaire_id: number;
  plan_tarifaire_nom: string;
  montant: number;
  date_echeance: Date;
  statut: ScheduleStatus;
  paiement_id?: number | null;
  jours_retard?: number; // Calculé si en retard
  created_at: Date;
}

/**
 * PaymentSchedule avec détails complets pour l'affichage
 */
export interface PaymentScheduleDetail extends PaymentScheduleWithRelations {
  utilisateur_nom_complet: string; // Ex: "John Doe"
  statut_label: string; // Ex: "En attente"
  montant_formatted: string; // Ex: "50,00 €"
  jours_retard?: number; // Nombre de jours de retard si applicable
  est_en_retard: boolean; // true si date_echeance passée et statut EN_ATTENTE
}

/**
 * PaymentSchedule pour calendrier d'échéances
 */
export interface PaymentScheduleCalendarItem {
  id: number;
  utilisateur_id: number;
  utilisateur_nom_complet: string;
  montant: number;
  date_echeance: Date;
  statut: ScheduleStatus;
  plan_tarifaire_nom: string;
}

/**
 * PaymentSchedule pour dashboard utilisateur
 */
export interface PaymentScheduleUserDashboard {
  id: number;
  montant: number;
  date_echeance: Date;
  statut: ScheduleStatus;
  plan_tarifaire_nom: string;
  est_en_retard: boolean;
  jours_retard?: number;
  paiement_effectue?: {
    id: number;
    date_paiement: Date;
    methode_paiement: string;
  };
}

/**
 * Statistiques des échéances
 */
export interface PaymentScheduleStats {
  total_echeances: number;
  total_montant: number;
  en_attente: {
    nombre: number;
    montant: number;
  };
  paye: {
    nombre: number;
    montant: number;
  };
  en_retard: {
    nombre: number;
    montant: number;
  };
  annule: {
    nombre: number;
    montant: number;
  };
}

/**
 * Résumé des échéances par utilisateur
 */
export interface PaymentScheduleUserSummary {
  utilisateur_id: number;
  utilisateur_nom_complet: string;
  utilisateur_email: string;
  total_echeances: number;
  montant_total: number;
  montant_paye: number;
  montant_en_attente: number;
  montant_en_retard: number;
  prochaine_echeance?: Date;
}

/**
 * Données pour créer une échéance
 */
export interface CreatePaymentScheduleData {
  utilisateur_id: number;
  plan_tarifaire_id: number;
  montant: number;
  date_echeance: Date;
  statut?: ScheduleStatus; // Default: EN_ATTENTE
}

/**
 * Données pour mettre à jour une échéance
 */
export interface UpdatePaymentScheduleData {
  montant?: number;
  date_echeance?: Date;
  statut?: ScheduleStatus;
  paiement_id?: number | null;
}

/**
 * Labels des statuts d'échéance
 */
export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  [ScheduleStatus.EN_ATTENTE]: 'En attente',
  [ScheduleStatus.PAYE]: 'Payé',
  [ScheduleStatus.EN_RETARD]: 'En retard',
  [ScheduleStatus.ANNULE]: 'Annulé',
};

/**
 * Couleurs associées aux statuts (pour UI)
 */
export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, string> = {
  [ScheduleStatus.EN_ATTENTE]: 'orange',
  [ScheduleStatus.PAYE]: 'green',
  [ScheduleStatus.EN_RETARD]: 'red',
  [ScheduleStatus.ANNULE]: 'gray',
};
