/**
 * Export des validators Zod pour le domaine des cours
 */

// Course Recurrent validators
export {
  createCourseRecurrentSchema,
  updateCourseRecurrentSchema,
  assignProfessorSchema,
  unassignProfessorSchema,
  searchCourseRecurrentSchema,
  toggleCourseRecurrentSchema,
  type CreateCourseRecurrentInput,
  type UpdateCourseRecurrentInput,
  type AssignProfessorInput,
  type UnassignProfessorInput,
  type SearchCourseRecurrentInput,
  type ToggleCourseRecurrentInput,
} from "./course-recurrent.validators.js";

// Course validators
export {
  createCourseSchema,
  updateCourseSchema,
  cancelCourseSchema,
  searchCourseSchema,
  duplicateCourseSchema,
  generateCoursesFromRecurrentSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
  type CancelCourseInput,
  type SearchCourseInput,
  type DuplicateCourseInput,
  type GenerateCoursesFromRecurrentInput,
} from "./course.validators.js";

// Professor validators
export {
  createProfessorSchema,
  updateProfessorSchema,
  searchProfessorSchema,
  toggleProfessorSchema,
  getProfessorCoursesSchema,
  type CreateProfessorInput,
  type UpdateProfessorInput,
  type SearchProfessorInput,
  type ToggleProfessorInput,
  type GetProfessorCoursesInput,
} from "./professor.validators.js";

// Inscription validators
export {
  createInscriptionSchema,
  updateInscriptionSchema,
  updatePresenceSchema,
  bulkCreateInscriptionSchema,
  searchInscriptionSchema,
  cancelInscriptionSchema,
  getUserInscriptionsSchema,
  getCourseInscriptionsSchema,
  bulkUpdatePresenceSchema,
  type CreateInscriptionInput,
  type UpdateInscriptionInput,
  type UpdatePresenceInput,
  type BulkCreateInscriptionInput,
  type SearchInscriptionInput,
  type CancelInscriptionInput,
  type GetUserInscriptionsInput,
  type GetCourseInscriptionsInput,
  type BulkUpdatePresenceInput,
} from "./inscription.validators.js";

// Reservation validators
export {
  createReservationSchema,
  cancelReservationSchema,
  searchReservationSchema,
  checkAvailabilitySchema,
  getUserReservationsSchema,
  getCourseReservationsSchema,
  convertReservationToInscriptionSchema,
  checkReservationConflictSchema,
  type CreateReservationInput,
  type CancelReservationInput,
  type SearchReservationInput,
  type CheckAvailabilityInput,
  type GetUserReservationsInput,
  type GetCourseReservationsInput,
  type ConvertReservationToInscriptionInput,
  type CheckReservationConflictInput,
} from "./reservation.validators.js";
