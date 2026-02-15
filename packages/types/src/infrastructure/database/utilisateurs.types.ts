/**
 * Types Database pour Utilisateurs (snake_case pour Prisma/DB)
 * Ces types correspondent aux tables de la base de données
 */

/**
 * Utilisateur complet dans la DB
 */
export interface UtilisateurDB {
  id: number;
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  password?: string;
  date_naissance: string | Date;
  date_inscription: string | Date;
  genre_id: number;
  grade_id: number | null;
  abonnement_id: number | null;
  status_id: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Genre dans la DB
 */
export interface GenreDB {
  id: number;
  genre_name: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Grade dans la DB
 */
export interface GradeDB {
  id: number;
  grade_id: string;
  grade_name: string;
  ordre?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Abonnement dans la DB
 */
export interface AbonnementDB {
  id: number;
  nom_plan: string;
  description?: string;
  prix?: number;
  duree_mois?: number;
  actif: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Status utilisateur dans la DB
 */
export interface StatusDB {
  id: number;
  status_name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Professeur dans la DB
 */
export interface ProfesseurDB {
  id: number;
  utilisateur_id: number;
  specialites?: string[];
  bio?: string;
  actif: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Relation familiale dans la DB
 */
export interface RelationFamilialeDB {
  id: number;
  responsable_id: number;
  membre_id: number;
  type_relation: 'parent' | 'enfant' | 'conjoint' | 'autre';
  est_responsable_legal: boolean;
  created_at: Date;
  updated_at?: Date;
}

/**
 * Préférences utilisateur dans la DB
 */
export interface UserPreferencesDB {
  id: number;
  user_id: number;
  langue: string;
  timezone: string;
  notifications_email: boolean;
  notifications_sms: boolean;
  theme?: 'light' | 'dark';
  created_at: Date;
  updated_at: Date;
}

/**
 * Historique de modification utilisateur dans la DB
 */
export interface UserHistoryDB {
  id: number;
  user_id: number;
  modified_by: number;
  action: 'create' | 'update' | 'delete' | 'soft_delete' | 'restore';
  changed_fields?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: Date;
}

/**
 * Statistiques utilisateur dans la DB
 */
export interface UserStatsDB {
  id: number;
  user_id: number;
  total_cours_suivis: number;
  total_presence: number;
  total_absence: number;
  taux_presence: number;
  derniere_presence?: Date | null;
  total_paiements: number;
  montant_total_paye: number;
  dernier_paiement?: Date | null;
  updated_at: Date;
}
