/**
 * Courses DTOs Index
 * Exports centralisés de tous les DTOs du domaine Courses
 */

// CourseRecurrent DTOs
export * from "./CourseRecurrentDto.js";

// Course DTOs
export * from "./CourseDto.js";

// Professor DTOs
export * from "./ProfessorDto.js";

// Inscription DTOs
export * from "./InscriptionDto.js";

// Reservation DTOs
export * from "./ReservationDto.js";

/**
 * Re-export des DTOs les plus utilisés
 */

// CourseRecurrent
export type {
  CreateCourseRecurrentDto,
  UpdateCourseRecurrentDto,
  CourseRecurrentResponseDto,
  CourseRecurrentListItemDto,
  AssignProfessorDto,
  SearchCourseRecurrentDto,
  WeeklyScheduleDto,
} from "./CourseRecurrentDto.js";

// Course
export type {
  CreateCourseDto,
  UpdateCourseDto,
  CourseResponseDto,
  CourseListItemDto,
  CancelCourseDto,
  SearchCourseDto,
  CourseCalendarDto,
} from "./CourseDto.js";

// Professor
export type {
  CreateProfessorDto,
  UpdateProfessorDto,
  ProfessorResponseDto,
  ProfessorListItemDto,
  SearchProfessorDto,
  ProfessorStatsDto,
} from "./ProfessorDto.js";

// Inscription
export type {
  CreateInscriptionDto,
  UpdateInscriptionDto,
  InscriptionResponseDto,
  InscriptionListItemDto,
  BulkCreateInscriptionDto,
  UpdatePresenceDto,
  SearchInscriptionDto,
  AttendanceSheetDto,
} from "./InscriptionDto.js";

// Reservation
export type {
  CreateReservationDto,
  CancelReservationDto,
  ReservationResponseDto,
  ReservationListItemDto,
  SearchReservationDto,
  ReservationAvailabilityDto,
} from "./ReservationDto.js";
