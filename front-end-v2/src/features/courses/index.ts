/**
 * Courses Feature - Public API
 *
 * Public exports for the courses feature following FSD architecture.
 * Only export what should be accessible from outside the feature.
 */

// UI Components
export { CourseCard } from './ui/CourseCard';
export { CoursesList } from './ui/CoursesList';

// Hooks
export {
  useCourses,
  useCourseDetail,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from './model/useCourses';

// Types
export type {
  Course,
  CourseType,
  CourseLevel,
  CourseStatus,
  CourseFilters,
  CreateCourseData,
  UpdateCourseData,
} from './model/types';

export {
  COURSE_TYPE_LABELS,
  COURSE_LEVEL_LABELS,
  COURSE_STATUS_LABELS,
} from './model/types';
