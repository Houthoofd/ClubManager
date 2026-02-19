// ============================================================================
// Teachers Feature Constants
// ============================================================================

/**
 * Tab keys pour la navigation dans les pages teachers
 */
export const TEACHER_TABS = {
  ADD: 0,
  LIST: 1,
  PLANNING: 0,
  STATISTICS: 1,
} as const;

/**
 * Labels des tabs
 */
export const TEACHER_TAB_LABELS = {
  ADD: 'Ajouter un professeur',
  LIST: 'Liste des professeurs',
  PLANNING: 'Mes Cours',
  STATISTICS: 'Statistiques',
} as const;

/**
 * Jours de la semaine
 */
export const DAYS_OF_WEEK = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
} as const;

/**
 * Jours de la semaine pour les filtres
 */
export const FILTER_DAYS = [
  { value: 'tous', label: 'Tous les jours' },
  { value: 'Lundi', label: 'Lundi' },
  { value: 'Mardi', label: 'Mardi' },
  { value: 'Mercredi', label: 'Mercredi' },
  { value: 'Jeudi', label: 'Jeudi' },
  { value: 'Vendredi', label: 'Vendredi' },
  { value: 'Samedi', label: 'Samedi' },
  { value: 'Dimanche', label: 'Dimanche' },
] as const;

/**
 * Messages de validation
 */
export const VALIDATION_MESSAGES = {
  NO_USERS_SELECTED: 'Veuillez sélectionner au moins un utilisateur',
  TEACHER_ALREADY_EXISTS: 'Cet utilisateur est déjà professeur',
  NO_TEACHER_SELECTED: 'Veuillez sélectionner un professeur',
  CONFIRM_REMOVE_TEACHER: 'Êtes-vous sûr de vouloir retirer ce professeur ?',
  CONFIRM_PROMOTE_USERS: 'Confirmer la promotion de ces utilisateurs en professeurs ?',
  SPECIALIZATION_REQUIRED: 'La spécialisation est requise',
  USER_REQUIRED: 'Veuillez sélectionner un utilisateur',
} as const;

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES = {
  TEACHER_PROMOTED: 'Professeur(s) promu(s) avec succès',
  TEACHER_CREATED: 'Professeur créé avec succès',
  TEACHER_UPDATED: 'Professeur mis à jour avec succès',
  TEACHER_REMOVED: 'Professeur retiré avec succès',
  TEACHER_DELETED: 'Professeur supprimé avec succès',
  PROMOTION_SUCCESS: 'Promotion effectuée avec succès !',
} as const;

/**
 * Messages d'erreur
 */
export const ERROR_MESSAGES = {
  TEACHER_PROMOTE_FAILED: 'Erreur lors de la promotion du/des professeur(s)',
  TEACHER_CREATE_FAILED: 'Erreur lors de la création du professeur',
  TEACHER_UPDATE_FAILED: 'Erreur lors de la mise à jour du professeur',
  TEACHER_REMOVE_FAILED: 'Erreur lors du retrait du professeur',
  TEACHER_DELETE_FAILED: 'Erreur lors de la suppression du professeur',
  LOAD_TEACHERS_FAILED: 'Erreur lors du chargement des professeurs',
  LOAD_PLANNING_FAILED: 'Erreur lors du chargement du planning',
  VERIFY_TEACHERS_FAILED: 'Erreur lors de la vérification des professeurs',
  ALREADY_TEACHER: 'Un ou plusieurs utilisateurs sont déjà professeurs',
} as const;

/**
 * Messages d'information
 */
export const INFO_MESSAGES = {
  NO_TEACHERS: 'Aucun professeur trouvé',
  NO_COURSES: 'Aucun cours trouvé',
  NO_USERS_AVAILABLE: 'Tous les utilisateurs sont déjà professeurs',
  TEACHERS_HIDDEN: 'Les utilisateurs déjà professeurs sont automatiquement masqués de cette liste',
  NO_SEARCH_RESULTS: 'Aucun résultat pour votre recherche',
  ALL_USERS_ARE_TEACHERS: 'Tous les utilisateurs sont déjà professeurs !',
} as const;

/**
 * Status ID pour les utilisateurs
 */
export const USER_STATUS = {
  VISITOR: 0,
  USER: 1,
  TEACHER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
} as const;

/**
 * Variantes PatternFly pour les messages
 */
export const MESSAGE_VARIANTS = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
} as const;

/**
 * Couleurs pour les statuts
 */
export const STATUS_COLORS = {
  ACTIVE: '#28a745',
  INACTIVE: '#6c757d',
  PENDING: '#ffc107',
  ERROR: '#dc3545',
} as const;

/**
 * Icônes pour les actions
 */
export const ACTION_ICONS = {
  ADD: '➕',
  EDIT: '✏️',
  DELETE: '🗑️',
  PROMOTE: '⬆️',
  DEMOTE: '⬇️',
  VIEW: '👁️',
  SEARCH: '🔍',
  FILTER: '🔽',
  CALENDAR: '📅',
  CLOCK: '🕐',
  USER: '👤',
  TEACHER: '👨‍🏫',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
} as const;

/**
 * Taille des résultats de recherche
 */
export const SEARCH_RESULTS_LIMIT = 50;

/**
 * Délai de debounce pour la recherche (ms)
 */
export const SEARCH_DEBOUNCE_DELAY = 300;

/**
 * Intervalle de polling pour le planning (ms)
 */
export const PLANNING_POLLING_INTERVAL = 60000; // 1 minute

/**
 * Classes CSS pour les composants
 */
export const TEACHER_CLASSES = {
  PAGE: 'teachers-page',
  CONTENT: 'teachers-content',
  LIST: 'teachers-list',
  CARD: 'teacher-card',
  PLANNING_CARD: 'planning-card',
  STATS_CARD: 'stats-card',
  FILTER: 'planning-filter',
  GRID: 'planning-grid',
  EMPTY_STATE: 'empty-state',
} as const;

/**
 * Capacité par défaut pour les cours
 */
export const DEFAULT_COURSE_CAPACITY = 20;

/**
 * Messages de confirmation
 */
export const CONFIRMATION_MESSAGES = {
  REMOVE_TEACHER: 'Êtes-vous sûr de vouloir retirer ce professeur ?',
  PROMOTE_USERS: 'Êtes-vous sûr de vouloir promouvoir ces utilisateurs en professeurs ?',
  DELETE_TEACHER: 'Cette action est irréversible. Confirmer la suppression ?',
  LAST_TEACHER_WARNING: 'Ce professeur est le dernier assigné à ce cours. Le cours sera automatiquement supprimé.',
} as const;

/**
 * Regex patterns pour validation
 */
export const VALIDATION_PATTERNS = {
  TIME: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
} as const;

/**
 * Durée d'auto-fermeture des modals de succès (ms)
 */
export const SUCCESS_MODAL_AUTO_CLOSE_DELAY = 3500;

/**
 * Couleurs du planning
 */
export const PLANNING_COLORS = {
  MONDAY: '#667eea',
  TUESDAY: '#764ba2',
  WEDNESDAY: '#f093fb',
  THURSDAY: '#4facfe',
  FRIDAY: '#00f2fe',
  SATURDAY: '#43e97b',
  SUNDAY: '#fa709a',
  DEFAULT: '#6c757d',
} as const;
