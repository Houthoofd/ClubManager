/**
 * Database Types pour le module Sports
 * Types snake_case correspondant aux colonnes de la base de données
 *
 * @module sports/database.types
 */

// ============================================================================
// SPORT DATABASE TYPES
// ============================================================================

/**
 * Sport dans la base de données (snake_case)
 */
export interface SportDB {
  id: number;
  code: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  requires_belt: boolean;
  allow_competitions: boolean;
  min_age: number | null;
  max_age: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Type pour création d'un sport dans la DB
 */
export interface SportInsertDB {
  code: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
  requires_belt?: boolean;
  allow_competitions?: boolean;
  min_age?: number | null;
  max_age?: number | null;
}

/**
 * Type pour mise à jour d'un sport dans la DB
 */
export interface SportUpdateDB {
  code?: string;
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
  requires_belt?: boolean;
  allow_competitions?: boolean;
  min_age?: number | null;
  max_age?: number | null;
  updated_at?: Date;
}

// ============================================================================
// SPORT CONFIGURATION DATABASE TYPES
// ============================================================================

/**
 * Configuration de sport dans la base de données
 */
export interface SportConfigurationDB {
  id: number;
  sport_id: number;
  config_key: string;
  config_value: string | null;
  data_type: "string" | "number" | "boolean" | "json" | "text";
  description: string | null;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Type pour création d'une configuration de sport
 */
export interface SportConfigurationInsertDB {
  sport_id: number;
  config_key: string;
  config_value?: string | null;
  data_type: "string" | "number" | "boolean" | "json" | "text";
  description?: string | null;
  is_public?: boolean;
}

/**
 * Type pour mise à jour d'une configuration de sport
 */
export interface SportConfigurationUpdateDB {
  config_value?: string | null;
  data_type?: "string" | "number" | "boolean" | "json" | "text";
  description?: string | null;
  is_public?: boolean;
  updated_at?: Date;
}

// ============================================================================
// USER SPORT DATABASE TYPES
// ============================================================================

/**
 * Association utilisateur-sport dans la base de données
 */
export interface UserSportDB {
  id: number;
  user_id: number;
  sport_id: number;
  current_grade_id: number | null;
  started_at: Date | null;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Type pour création d'une association utilisateur-sport
 */
export interface UserSportInsertDB {
  user_id: number;
  sport_id: number;
  current_grade_id?: number | null;
  started_at?: Date | null;
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string | null;
}

/**
 * Type pour mise à jour d'une association utilisateur-sport
 */
export interface UserSportUpdateDB {
  current_grade_id?: number | null;
  started_at?: Date | null;
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string | null;
  updated_at?: Date;
}

// ============================================================================
// USER GRADE HISTORY DATABASE TYPES
// ============================================================================

/**
 * Historique des grades dans la base de données
 */
export interface UserGradeHistoryDB {
  id: number;
  user_id: number;
  sport_id: number;
  grade_id: number;
  obtained_at: Date;
  examiner_id: number | null;
  location: string | null;
  certificate_number: string | null;
  notes: string | null;
  created_at: Date;
}

/**
 * Type pour création d'un historique de grade
 */
export interface UserGradeHistoryInsertDB {
  user_id: number;
  sport_id: number;
  grade_id: number;
  obtained_at: Date;
  examiner_id?: number | null;
  location?: string | null;
  certificate_number?: string | null;
  notes?: string | null;
}

// ============================================================================
// SPORT EQUIPMENT DATABASE TYPES
// ============================================================================

/**
 * Équipement de sport dans la base de données
 */
export interface SportEquipmentDB {
  id: number;
  sport_id: number;
  name: string;
  description: string | null;
  is_mandatory: boolean;
  for_level: "beginner" | "intermediate" | "advanced" | "competition" | "all";
  category_id: number | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Type pour création d'un équipement de sport
 */
export interface SportEquipmentInsertDB {
  sport_id: number;
  name: string;
  description?: string | null;
  is_mandatory?: boolean;
  for_level?: "beginner" | "intermediate" | "advanced" | "competition" | "all";
  category_id?: number | null;
  display_order?: number;
}

/**
 * Type pour mise à jour d'un équipement de sport
 */
export interface SportEquipmentUpdateDB {
  name?: string;
  description?: string | null;
  is_mandatory?: boolean;
  for_level?: "beginner" | "intermediate" | "advanced" | "competition" | "all";
  category_id?: number | null;
  display_order?: number;
  updated_at?: Date;
}

// ============================================================================
// SPORT COMPETITION RULE DATABASE TYPES
// ============================================================================

/**
 * Règle de compétition dans la base de données
 */
export interface SportCompetitionRuleDB {
  id: number;
  sport_id: number;
  rule_name: string;
  rule_type: "scoring" | "time" | "safety" | "equipment" | "category" | "other";
  description: string;
  applies_to: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Type pour création d'une règle de compétition
 */
export interface SportCompetitionRuleInsertDB {
  sport_id: number;
  rule_name: string;
  rule_type: "scoring" | "time" | "safety" | "equipment" | "category" | "other";
  description: string;
  applies_to?: string | null;
  is_active?: boolean;
  display_order?: number;
}

/**
 * Type pour mise à jour d'une règle de compétition
 */
export interface SportCompetitionRuleUpdateDB {
  rule_name?: string;
  rule_type?:
    | "scoring"
    | "time"
    | "safety"
    | "equipment"
    | "category"
    | "other";
  description?: string;
  applies_to?: string | null;
  is_active?: boolean;
  display_order?: number;
  updated_at?: Date;
}

// ============================================================================
// SPORT STATISTICS DATABASE TYPES
// ============================================================================

/**
 * Statistiques de sport dans la base de données
 */
export interface SportStatisticDB {
  id: number;
  sport_id: number;
  user_id: number | null;
  stat_date: Date;
  total_members: number;
  total_courses: number;
  total_hours: number;
  total_competitions: number;
  total_revenue: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Type pour création de statistiques de sport
 */
export interface SportStatisticInsertDB {
  sport_id: number;
  user_id?: number | null;
  stat_date: Date;
  total_members?: number;
  total_courses?: number;
  total_hours?: number;
  total_competitions?: number;
  total_revenue?: number;
}

/**
 * Type pour mise à jour de statistiques de sport
 */
export interface SportStatisticUpdateDB {
  total_members?: number;
  total_courses?: number;
  total_hours?: number;
  total_competitions?: number;
  total_revenue?: number;
  updated_at?: Date;
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

/**
 * Sport avec relations et compteurs
 */
export interface SportQueryResult extends SportDB {
  configurations?: SportConfigurationDB[];
  user_sports_count?: number;
  courses_count?: number;
  grades_count?: number;
}

/**
 * UserSport avec informations du sport et du grade
 */
export interface UserSportQueryResult extends UserSportDB {
  sport_code?: string;
  sport_name?: string;
  sport_color?: string;
  grade_nom?: string;
  grade_couleur?: string;
  user_first_name?: string;
  user_last_name?: string;
}

/**
 * UserGradeHistory avec informations des relations
 */
export interface UserGradeHistoryQueryResult extends UserGradeHistoryDB {
  sport_name?: string;
  sport_code?: string;
  grade_nom?: string;
  grade_couleur?: string;
  examiner_first_name?: string;
  examiner_last_name?: string;
  user_first_name?: string;
  user_last_name?: string;
}

/**
 * Statistiques agrégées par sport
 */
export interface SportStatsAggregateDB {
  sport_id: number;
  sport_name: string;
  sport_code: string;
  total_members: number;
  active_members: number;
  total_courses: number;
  total_hours: number;
  total_competitions: number;
  total_revenue: number;
  period_start: Date | null;
  period_end: Date | null;
}
