/**
 * Activities Domain Types
 *
 * TypeScript types for activities domain including database entities,
 * API operations, and business logic types.
 */

// ============================================================================
// API OPERATION TYPES
// ============================================================================

/**
 * Options de filtrage pour activities
 */
export interface ActivitiesFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  categoryId?: number;
  hasLevels?: boolean;
  isActive?: boolean;
}

/**
 * Résultat paginé pour activities
 */
export interface ActivitiesPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface ActivitiesMutationResult {
  success: boolean;
  message: string;
  data?: any;
}

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

export interface ActivityCategories {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
  created_at?: string;
}

export interface ActivityCategoriesInsert {
  name: string;
  description?: string;
  active?: boolean;
}

export interface ActivityCategoriesUpdate {
  name?: string;
  description?: string;
  active?: boolean;
  created_at?: string;
}

export interface Activities {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  /** Indique si cette activité a des niveaux/grades */
  has_levels?: boolean;
  active?: boolean;
  created_at?: string;
}

export interface ActivitiesInsert {
  category_id: number;
  name: string;
  description?: string;
  /** Indique si cette activité a des niveaux/grades */
  has_levels?: boolean;
  active?: boolean;
}

export interface ActivitiesUpdate {
  category_id?: number;
  name?: string;
  description?: string;
  /** Indique si cette activité a des niveaux/grades */
  has_levels?: boolean;
  active?: boolean;
  created_at?: string;
}

export interface ActivityLevels {
  id: number;
  activity_id: number;
  /** Ex: Débutant, Intermédiaire, Avancé OU Ceinture blanche, jaune, etc. */
  name: string;
  /** Ordre du niveau (1=débutant, 2=intermédiaire, etc.) */
  level_order: number;
  /** Couleur associée (pour ceintures, badges, etc.) */
  color?: string;
  description?: string;
}

export interface ActivityLevelsInsert {
  activity_id: number;
  /** Ex: Débutant, Intermédiaire, Avancé OU Ceinture blanche, jaune, etc. */
  name: string;
  /** Ordre du niveau (1=débutant, 2=intermédiaire, etc.) */
  level_order: number;
  /** Couleur associée (pour ceintures, badges, etc.) */
  color?: string;
  description?: string;
}

export interface ActivityLevelsUpdate {
  activity_id?: number;
  /** Ex: Débutant, Intermédiaire, Avancé OU Ceinture blanche, jaune, etc. */
  name?: string;
  /** Ordre du niveau (1=débutant, 2=intermédiaire, etc.) */
  level_order?: number;
  /** Couleur associée (pour ceintures, badges, etc.) */
  color?: string;
  description?: string;
}

export interface UserActivities {
  id: number;
  user_id: number;
  activity_id: number;
  current_level_id?: number;
  started_at?: string;
  is_active?: boolean;
  /** Notes spécifiques à cette pratique */
  notes?: string;
  created_at?: string;
}

export interface UserActivitiesInsert {
  user_id: number;
  activity_id: number;
  current_level_id?: number;
  started_at?: string;
  is_active?: boolean;
  /** Notes spécifiques à cette pratique */
  notes?: string;
}

export interface UserActivitiesUpdate {
  user_id?: number;
  activity_id?: number;
  current_level_id?: number;
  started_at?: string;
  is_active?: boolean;
  /** Notes spécifiques à cette pratique */
  notes?: string;
  created_at?: string;
}
