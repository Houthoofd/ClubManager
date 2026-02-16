/**
 * Types pour le domaine Sports
 * Système multi-sports pour ClubManager
 *
 * @module sports/types
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Type de données pour la configuration d'un sport
 */
export enum SportConfigDataType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  JSON = "json",
  TEXT = "text",
}

/**
 * Niveau d'équipement requis
 */
export enum SportEquipmentLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  COMPETITION = "competition",
  ALL = "all",
}

/**
 * Type de règle de compétition
 */
export enum CompetitionRuleType {
  SCORING = "scoring",
  TIME = "time",
  SAFETY = "safety",
  EQUIPMENT = "equipment",
  CATEGORY = "category",
  OTHER = "other",
}

// ============================================================================
// SPORT TYPES
// ============================================================================

/**
 * Représente un sport dans le système
 *
 * @example
 * const sport: Sport = {
 *   id: 1,
 *   code: "KARATE",
 *   name: "Karaté",
 *   description: "Art martial japonais",
 *   color: "#FF0000",
 *   is_active: true,
 *   display_order: 1,
 *   requires_belt: true,
 *   allow_competitions: true,
 *   created_at: new Date(),
 *   updated_at: new Date(),
 * };
 */
export interface Sport {
  /** Identifiant unique */
  id: number;

  /** Code unique du sport (ex: KARATE, JUDO) */
  code: string;

  /** Nom du sport */
  name: string;

  /** Description détaillée */
  description?: string | null;

  /** Couleur associée (format hex) */
  color: string;

  /** Icône du sport */
  icon?: string | null;

  /** URL de l'image du sport */
  image_url?: string | null;

  /** Le sport est-il actif ? */
  is_active: boolean;

  /** Ordre d'affichage */
  display_order: number;

  /** Nécessite-t-il des ceintures/grades ? */
  requires_belt: boolean;

  /** Autorise-t-il les compétitions ? */
  allow_competitions: boolean;

  /** Âge minimum recommandé */
  min_age?: number | null;

  /** Âge maximum recommandé */
  max_age?: number | null;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer un nouveau sport
 */
export interface CreateSportInput {
  code: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
  requires_belt?: boolean;
  allow_competitions?: boolean;
  min_age?: number;
  max_age?: number;
}

/**
 * Données pour mettre à jour un sport
 */
export interface UpdateSportInput {
  code?: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
  requires_belt?: boolean;
  allow_competitions?: boolean;
  min_age?: number;
  max_age?: number;
}

// ============================================================================
// SPORT CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration spécifique à un sport
 */
export interface SportConfiguration {
  /** Identifiant unique */
  id: number;

  /** ID du sport */
  sport_id: number;

  /** Clé de configuration */
  config_key: string;

  /** Valeur de configuration */
  config_value?: string | null;

  /** Type de données */
  data_type: SportConfigDataType;

  /** Description de la configuration */
  description?: string | null;

  /** La configuration est-elle publique ? */
  is_public: boolean;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer une configuration de sport
 */
export interface CreateSportConfigurationInput {
  sport_id: number;
  config_key: string;
  config_value?: string;
  data_type: SportConfigDataType;
  description?: string;
  is_public?: boolean;
}

/**
 * Données pour mettre à jour une configuration de sport
 */
export interface UpdateSportConfigurationInput {
  config_value?: string;
  data_type?: SportConfigDataType;
  description?: string;
  is_public?: boolean;
}

// ============================================================================
// USER SPORT TYPES
// ============================================================================

/**
 * Représente la pratique d'un sport par un utilisateur
 */
export interface UserSport {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** ID du sport */
  sport_id: number;

  /** ID du grade actuel */
  current_grade_id?: number | null;

  /** Date de début de pratique */
  started_at?: Date | null;

  /** Sport principal de l'utilisateur ? */
  is_primary: boolean;

  /** Pratique active ? */
  is_active: boolean;

  /** Notes additionnelles */
  notes?: string | null;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour assigner un sport à un utilisateur
 */
export interface CreateUserSportInput {
  user_id: number;
  sport_id: number;
  current_grade_id?: number;
  started_at?: Date | string;
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string;
}

/**
 * Données pour mettre à jour la pratique d'un sport par un utilisateur
 */
export interface UpdateUserSportInput {
  current_grade_id?: number;
  started_at?: Date | string;
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string;
}

// ============================================================================
// USER GRADE HISTORY TYPES
// ============================================================================

/**
 * Historique des grades obtenus par un utilisateur
 */
export interface UserGradeHistory {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** ID du sport */
  sport_id: number;

  /** ID du grade obtenu */
  grade_id: number;

  /** Date d'obtention du grade */
  obtained_at: Date;

  /** ID de l'examinateur */
  examiner_id?: number | null;

  /** Lieu de l'examen */
  location?: string | null;

  /** Numéro de certificat */
  certificate_number?: string | null;

  /** Notes additionnelles */
  notes?: string | null;

  /** Date de création de l'enregistrement */
  created_at: Date;
}

/**
 * Données pour enregistrer un nouveau grade
 */
export interface CreateUserGradeHistoryInput {
  user_id: number;
  sport_id: number;
  grade_id: number;
  obtained_at: Date | string;
  examiner_id?: number;
  location?: string;
  certificate_number?: string;
  notes?: string;
}

// ============================================================================
// SPORT EQUIPMENT TYPES
// ============================================================================

/**
 * Équipement requis pour un sport
 */
export interface SportEquipment {
  /** Identifiant unique */
  id: number;

  /** ID du sport */
  sport_id: number;

  /** Nom de l'équipement */
  name: string;

  /** Description de l'équipement */
  description?: string | null;

  /** Équipement obligatoire ? */
  is_mandatory: boolean;

  /** Niveau requis */
  for_level: SportEquipmentLevel;

  /** ID de la catégorie d'article */
  category_id?: number | null;

  /** Ordre d'affichage */
  display_order: number;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer un équipement de sport
 */
export interface CreateSportEquipmentInput {
  sport_id: number;
  name: string;
  description?: string;
  is_mandatory?: boolean;
  for_level?: SportEquipmentLevel;
  category_id?: number;
  display_order?: number;
}

/**
 * Données pour mettre à jour un équipement de sport
 */
export interface UpdateSportEquipmentInput {
  name?: string;
  description?: string;
  is_mandatory?: boolean;
  for_level?: SportEquipmentLevel;
  category_id?: number;
  display_order?: number;
}

// ============================================================================
// SPORT COMPETITION RULE TYPES
// ============================================================================

/**
 * Règle de compétition pour un sport
 */
export interface SportCompetitionRule {
  /** Identifiant unique */
  id: number;

  /** ID du sport */
  sport_id: number;

  /** Nom de la règle */
  rule_name: string;

  /** Type de règle */
  rule_type: CompetitionRuleType;

  /** Description de la règle */
  description: string;

  /** À qui s'applique la règle */
  applies_to?: string | null;

  /** Règle active ? */
  is_active: boolean;

  /** Ordre d'affichage */
  display_order: number;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer une règle de compétition
 */
export interface CreateSportCompetitionRuleInput {
  sport_id: number;
  rule_name: string;
  rule_type: CompetitionRuleType;
  description: string;
  applies_to?: string;
  is_active?: boolean;
  display_order?: number;
}

/**
 * Données pour mettre à jour une règle de compétition
 */
export interface UpdateSportCompetitionRuleInput {
  rule_name?: string;
  rule_type?: CompetitionRuleType;
  description?: string;
  applies_to?: string;
  is_active?: boolean;
  display_order?: number;
}

// ============================================================================
// SPORT STATISTICS TYPES
// ============================================================================

/**
 * Statistiques d'un sport
 */
export interface SportStatistic {
  /** Identifiant unique */
  id: number;

  /** ID du sport */
  sport_id: number;

  /** ID de l'utilisateur (optionnel pour stats globales) */
  user_id?: number | null;

  /** Date des statistiques */
  stat_date: Date;

  /** Nombre total de membres */
  total_members: number;

  /** Nombre total de cours */
  total_courses: number;

  /** Nombre total d'heures */
  total_hours: number;

  /** Nombre total de compétitions */
  total_competitions: number;

  /** Revenu total */
  total_revenue: number;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer des statistiques de sport
 */
export interface CreateSportStatisticInput {
  sport_id: number;
  user_id?: number;
  stat_date: Date | string;
  total_members?: number;
  total_courses?: number;
  total_hours?: number;
  total_competitions?: number;
  total_revenue?: number;
}

/**
 * Données pour mettre à jour des statistiques de sport
 */
export interface UpdateSportStatisticInput {
  total_members?: number;
  total_courses?: number;
  total_hours?: number;
  total_competitions?: number;
  total_revenue?: number;
}

// ============================================================================
// SPORT WITH RELATIONS
// ============================================================================

/**
 * Sport avec ses relations
 */
export interface SportWithDetails extends Sport {
  /** Configurations du sport */
  configurations?: SportConfiguration[];

  /** Grades associés au sport */
  grades?: any[];

  /** Équipements du sport */
  equipment?: SportEquipment[];

  /** Règles de compétition */
  competition_rules?: SportCompetitionRule[];

  /** Compteurs */
  _count?: {
    user_sports?: number;
    courses?: number;
    grades?: number;
  };
}

/**
 * UserSport avec ses relations
 */
export interface UserSportWithDetails extends UserSport {
  /** Informations du sport */
  sport?: Sport;

  /** Grade actuel */
  current_grade?: any;

  /** Utilisateur */
  user?: any;
}

/**
 * UserGradeHistory avec ses relations
 */
export interface UserGradeHistoryWithDetails extends UserGradeHistory {
  /** Informations du sport */
  sport?: Sport;

  /** Informations du grade */
  grade?: any;

  /** Informations de l'examinateur */
  examiner?: any;

  /** Informations de l'utilisateur */
  user?: any;
}

// ============================================================================
// QUERY & FILTER TYPES
// ============================================================================

/**
 * Filtre pour récupérer les sports
 */
export interface GetSportsInput {
  is_active?: boolean;
  requires_belt?: boolean;
  allow_competitions?: boolean;
  include_configurations?: boolean;
  include_stats?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filtre pour récupérer les sports d'un utilisateur
 */
export interface GetUserSportsInput {
  user_id: number;
  is_active?: boolean;
  is_primary?: boolean;
  include_sport?: boolean;
  include_grade?: boolean;
}

/**
 * Requête de statistiques d'un sport
 */
export interface SportStatsQuery {
  sport_id: number;
  start_date?: Date | string;
  end_date?: Date | string;
  include_user_stats?: boolean;
}

/**
 * Résumé des statistiques d'un sport
 */
export interface SportStatsSummary {
  sport_id: number;
  sport_name: string;
  total_members: number;
  active_members: number;
  total_courses: number;
  total_hours: number;
  total_competitions: number;
  total_revenue: number;
  period_start?: Date;
  period_end?: Date;
}

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

/**
 * Résultat de création d'un sport
 */
export interface CreateSportResult {
  success: boolean;
  message: string;
  sport?: Sport;
  error?: string;
}

/**
 * Résultat de mise à jour d'un sport
 */
export interface UpdateSportResult {
  success: boolean;
  message: string;
  sport?: Sport;
  error?: string;
}

/**
 * Résultat de suppression d'un sport
 */
export interface DeleteSportResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Résultat d'assignation d'un sport à un utilisateur
 */
export interface AssignUserSportResult {
  success: boolean;
  message: string;
  userSport?: UserSport;
  error?: string;
}

/**
 * Résultat d'enregistrement d'un grade
 */
export interface RecordGradeResult {
  success: boolean;
  message: string;
  gradeHistory?: UserGradeHistory;
  error?: string;
}

/**
 * Liste paginée de sports
 */
export interface SportsList {
  items: Sport[];
  total: number;
  hasMore: boolean;
}
