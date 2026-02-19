/**
 * Constants for the Courses feature
 *
 * This file contains all constant values used across the courses domain,
 * including course types, days of the week, time slots, validation rules, etc.
 */

// ============================================================================
// Course Types
// ============================================================================

/**
 * Available course types in the club
 */
export const COURSE_TYPES = {
  GI: 'Gi',
  NO_GI: 'No-Gi',
  KIDS: 'Enfants',
  COMPETITION: 'Compétition',
  OPEN_MAT: 'Open Mat',
  TECHNIQUE: 'Technique',
  SPARRING: 'Sparring',
} as const;

export const COURSE_TYPE_OPTIONS = Object.values(COURSE_TYPES);

/**
 * Course type display labels
 */
export const COURSE_TYPE_LABELS: Record<string, string> = {
  [COURSE_TYPES.GI]: 'Gi (Kimono)',
  [COURSE_TYPES.NO_GI]: 'No-Gi (Sans kimono)',
  [COURSE_TYPES.KIDS]: 'Cours enfants',
  [COURSE_TYPES.COMPETITION]: 'Préparation compétition',
  [COURSE_TYPES.OPEN_MAT]: 'Open Mat (Entraînement libre)',
  [COURSE_TYPES.TECHNIQUE]: 'Technique',
  [COURSE_TYPES.SPARRING]: 'Sparring',
};

// ============================================================================
// Days of the Week
// ============================================================================

/**
 * Days of the week (French)
 */
export const DAYS_OF_WEEK = {
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
  DIMANCHE: 'Dimanche',
} as const;

export const DAYS_OF_WEEK_OPTIONS = Object.values(DAYS_OF_WEEK);

/**
 * Abbreviated day names
 */
export const DAY_ABBREVIATIONS: Record<string, string> = {
  [DAYS_OF_WEEK.LUNDI]: 'Lun',
  [DAYS_OF_WEEK.MARDI]: 'Mar',
  [DAYS_OF_WEEK.MERCREDI]: 'Mer',
  [DAYS_OF_WEEK.JEUDI]: 'Jeu',
  [DAYS_OF_WEEK.VENDREDI]: 'Ven',
  [DAYS_OF_WEEK.SAMEDI]: 'Sam',
  [DAYS_OF_WEEK.DIMANCHE]: 'Dim',
};

/**
 * Day order for sorting
 */
export const DAY_ORDER = [
  DAYS_OF_WEEK.LUNDI,
  DAYS_OF_WEEK.MARDI,
  DAYS_OF_WEEK.MERCREDI,
  DAYS_OF_WEEK.JEUDI,
  DAYS_OF_WEEK.VENDREDI,
  DAYS_OF_WEEK.SAMEDI,
  DAYS_OF_WEEK.DIMANCHE,
];

// ============================================================================
// Time Slots
// ============================================================================

/**
 * Common course time slots
 */
export const TIME_SLOTS = {
  MORNING: { start: '09:00', end: '10:30', label: 'Matinée' },
  LUNCH: { start: '12:00', end: '13:30', label: 'Midi' },
  AFTERNOON: { start: '17:00', end: '18:30', label: 'Après-midi' },
  EVENING: { start: '18:30', end: '20:00', label: 'Soirée' },
  NIGHT: { start: '20:00', end: '21:30', label: 'Soir' },
} as const;

/**
 * Default course duration in minutes
 */
export const DEFAULT_COURSE_DURATION = 90;

/**
 * Minimum and maximum course duration in minutes
 */
export const MIN_COURSE_DURATION = 30;
export const MAX_COURSE_DURATION = 180;

// ============================================================================
// Inscription Status
// ============================================================================

/**
 * Inscription status values
 */
export const INSCRIPTION_STATUS = {
  PENDING: 'en_attente',
  CONFIRMED: 'confirmée',
  CANCELLED: 'annulée',
  PRESENT: 'présent',
  ABSENT: 'absent',
} as const;

/**
 * Inscription status display labels
 */
export const INSCRIPTION_STATUS_LABELS: Record<string, string> = {
  [INSCRIPTION_STATUS.PENDING]: 'En attente',
  [INSCRIPTION_STATUS.CONFIRMED]: 'Confirmée',
  [INSCRIPTION_STATUS.CANCELLED]: 'Annulée',
  [INSCRIPTION_STATUS.PRESENT]: 'Présent',
  [INSCRIPTION_STATUS.ABSENT]: 'Absent',
};

/**
 * Inscription status colors (for UI badges/chips)
 */
export const INSCRIPTION_STATUS_COLORS: Record<string, string> = {
  [INSCRIPTION_STATUS.PENDING]: 'orange',
  [INSCRIPTION_STATUS.CONFIRMED]: 'green',
  [INSCRIPTION_STATUS.CANCELLED]: 'red',
  [INSCRIPTION_STATUS.PRESENT]: 'blue',
  [INSCRIPTION_STATUS.ABSENT]: 'grey',
};

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Maximum number of participants per course
 */
export const MAX_PARTICIPANTS_PER_COURSE = 30;

/**
 * Minimum number of participants to run a course
 */
export const MIN_PARTICIPANTS_TO_RUN = 3;

/**
 * Maximum number of courses a participant can enroll in per week
 */
export const MAX_COURSES_PER_PARTICIPANT_PER_WEEK = 5;

/**
 * Minimum notice period for course cancellation (in hours)
 */
export const MIN_CANCELLATION_NOTICE_HOURS = 24;

/**
 * Minimum number of professors required per course
 */
export const MIN_PROFESSORS_PER_COURSE = 1;

/**
 * Maximum number of professors per course
 */
export const MAX_PROFESSORS_PER_COURSE = 3;

// ============================================================================
// UI Constants
// ============================================================================

/**
 * Tab keys for course management page
 */
export const COURSE_TABS = {
  ADD_COURSE: 0,
  MANAGE_COURSES: 1,
  MANAGE_PROFESSORS: 2,
} as const;

/**
 * Tab labels
 */
export const COURSE_TAB_LABELS = {
  [COURSE_TABS.ADD_COURSE]: 'Ajouter un cours',
  [COURSE_TABS.MANAGE_COURSES]: 'Gérer les cours',
  [COURSE_TABS.MANAGE_PROFESSORS]: 'Gérer les professeurs',
};

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Page size options
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ============================================================================
// Messages
// ============================================================================

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  COURSE_CREATED: 'Le cours a été créé avec succès !',
  COURSE_UPDATED: 'Le cours a été modifié avec succès !',
  COURSE_DELETED: 'Le cours a été supprimé avec succès !',
  INSCRIPTION_CREATED: 'Inscription enregistrée avec succès !',
  INSCRIPTION_CANCELLED: 'Inscription annulée avec succès !',
  PROFESSOR_ASSIGNED: 'Professeur assigné avec succès !',
  PROFESSOR_REMOVED: 'Professeur retiré avec succès !',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  COURSE_CONFLICT: 'Un cours existe déjà à ce créneau horaire.',
  COURSE_NOT_FOUND: 'Cours introuvable.',
  COURSE_FULL: 'Ce cours est complet.',
  ALREADY_ENROLLED: 'Vous êtes déjà inscrit à ce cours.',
  MAX_COURSES_REACHED: 'Vous avez atteint le nombre maximum de cours par semaine.',
  MIN_PROFESSORS_REQUIRED: 'Un cours doit avoir au moins un professeur.',
  LAST_PROFESSOR_WARNING: 'Attention : ce professeur est le seul assigné à ce cours.',
  INVALID_TIME_SLOT: 'L\'horaire sélectionné est invalide.',
  CANCELLATION_TOO_LATE: 'Le délai d\'annulation minimum n\'est pas respecté.',
  LOADING_ERROR: 'Erreur lors du chargement des données.',
  SAVE_ERROR: 'Erreur lors de l\'enregistrement.',
};

/**
 * Warning messages
 */
export const WARNING_MESSAGES = {
  FEW_PARTICIPANTS: 'Le nombre de participants est inférieur au minimum recommandé.',
  COURSE_ALMOST_FULL: 'Il ne reste que quelques places disponibles.',
  SCHEDULE_CONFLICT: 'Ce créneau horaire est proche d\'un autre cours.',
};

// ============================================================================
// API/GraphQL Constants
// ============================================================================

/**
 * Query keys for React Query cache
 */
export const QUERY_KEYS = {
  COURSES: 'courses',
  COURSE_DETAILS: 'course-details',
  PROFESSORS: 'professors',
  PARTICIPANTS: 'participants',
  INSCRIPTIONS: 'inscriptions',
  COURSE_PLANNING: 'course-planning',
  USER_COURSES: 'user-courses',
} as const;

/**
 * Mutation keys
 */
export const MUTATION_KEYS = {
  CREATE_COURSE: 'create-course',
  UPDATE_COURSE: 'update-course',
  DELETE_COURSE: 'delete-course',
  CREATE_INSCRIPTION: 'create-inscription',
  UPDATE_INSCRIPTION: 'update-inscription',
  CANCEL_INSCRIPTION: 'cancel-inscription',
  ASSIGN_PROFESSOR: 'assign-professor',
  REMOVE_PROFESSOR: 'remove-professor',
} as const;

/**
 * Cache invalidation delay (ms)
 */
export const CACHE_INVALIDATION_DELAY = 500;

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Feature flags for courses module
 */
export const FEATURES = {
  ENABLE_WAITING_LIST: true,
  ENABLE_RECURRENT_COURSES: true,
  ENABLE_COURSE_RATINGS: false,
  ENABLE_ATTENDANCE_TRACKING: true,
  ENABLE_MULTI_PROFESSOR: true,
} as const;

// ============================================================================
// Export all constants as a single object (optional convenience export)
// ============================================================================

export const COURSES_CONSTANTS = {
  COURSE_TYPES,
  COURSE_TYPE_OPTIONS,
  COURSE_TYPE_LABELS,
  DAYS_OF_WEEK,
  DAYS_OF_WEEK_OPTIONS,
  DAY_ABBREVIATIONS,
  DAY_ORDER,
  TIME_SLOTS,
  DEFAULT_COURSE_DURATION,
  MIN_COURSE_DURATION,
  MAX_COURSE_DURATION,
  INSCRIPTION_STATUS,
  INSCRIPTION_STATUS_LABELS,
  INSCRIPTION_STATUS_COLORS,
  MAX_PARTICIPANTS_PER_COURSE,
  MIN_PARTICIPANTS_TO_RUN,
  MAX_COURSES_PER_PARTICIPANT_PER_WEEK,
  MIN_CANCELLATION_NOTICE_HOURS,
  MIN_PROFESSORS_PER_COURSE,
  MAX_PROFESSORS_PER_COURSE,
  COURSE_TABS,
  COURSE_TAB_LABELS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  QUERY_KEYS,
  MUTATION_KEYS,
  CACHE_INVALIDATION_DELAY,
  FEATURES,
} as const;
