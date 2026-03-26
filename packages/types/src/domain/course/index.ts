/**
 * Course Domain Types Index
 * Exports centralisés de tous les types du domaine Course
 */

// CourseRecurrent (cours récurrents/templates)
export * from "./CourseRecurrent.types.js";

// Course (instances de cours)
export * from "./Course.types.js";

// Professor (professeurs)
export * from "./Professor.types.js";

// Inscription (inscriptions aux cours)
export * from "./Inscription.types.js";

// Reservation (réservations de cours)
export * from "./Reservation.types.js";

/**
 * Re-export des types les plus utilisés
 */
export type {
  CourseRecurrent,
  CourseRecurrentWithRelations,
  CourseRecurrentPublic,
  CourseRecurrentBasic,
  DayOfWeek,
} from "./CourseRecurrent.types.js";

export type {
  Course,
  CourseWithRelations,
  CoursePublic,
  CourseBasic,
  CourseDetail,
  CourseCalendarItem,
} from "./Course.types.js";

export type {
  Professor,
  ProfessorWithRelations,
  ProfessorPublic,
  ProfessorBasic,
  ProfessorListItem,
  ProfessorWithStats,
} from "./Professor.types.js";

export type {
  Inscription,
  InscriptionWithRelations,
  InscriptionPublic,
  InscriptionBasic,
  InscriptionListItem,
  InscriptionAttendanceSheet,
  InscriptionStats,
  PresenceStatus,
} from "./Inscription.types.js";

export type {
  Reservation,
  ReservationWithRelations,
  ReservationPublic,
  ReservationBasic,
  ReservationListItem,
  ReservationUserPlanning,
  ReservationStats,
  ReservationWithAvailability,
} from "./Reservation.types.js";

// Re-export constants
export { DAY_OF_WEEK_NAMES } from "./CourseRecurrent.types.js";
