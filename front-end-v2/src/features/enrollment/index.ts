/**
 * @feature Enrollment
 * @layer Public API
 * @description Point d'entrée public de la feature Enrollment
 */

// API Layer
export { enrollmentApi } from './api/enrollmentApi';

// Model Layer - Types
export type {
  Enrollment,
  EnrollmentCreateDto,
  EnrollmentUpdateDto,
  EnrollmentResult,
  CourseCapacity,
  EnrollmentFilters,
} from './model/types';

export { EnrollmentStatus } from './model/types';

// Model Layer - Hooks
export {
  useEnroll,
  useUnenroll,
  useMyEnrollments,
  useEnrollment,
  useCourseCapacity,
} from './model/useEnrollment';

// UI Layer
export { EnrollButton } from './ui/EnrollButton';
export { UnenrollButton } from './ui/UnenrollButton';
export { EnrollmentStatusBadge } from './ui/EnrollmentStatusBadge';
export { MyEnrollmentsList } from './ui/MyEnrollmentsList';
