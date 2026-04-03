/**
 * Enrollment Feature - Type Definitions
 *
 * Types and interfaces for the enrollment feature.
 * Handles course enrollments, waitlists, and capacity management.
 */

// ============================================================================
// Enrollment Status
// ============================================================================

/**
 * Status of an enrollment
 */
export enum EnrollmentStatus {
  /** Enrollment is confirmed and active */
  CONFIRMED = 'CONFIRMED',
  /** Enrollment is pending approval */
  PENDING = 'PENDING',
  /** Student is on the waitlist */
  WAITLIST = 'WAITLIST',
  /** Enrollment was cancelled by the student */
  CANCELLED = 'CANCELLED',
  /** Enrollment was rejected by admin/professor */
  REJECTED = 'REJECTED',
}

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Course preview information (minimal data)
 */
export interface CoursePreview {
  id: number;
  title: string;
  code?: string;
  schedule?: string;
  location?: string;
  professorName?: string;
}

/**
 * Student preview information (minimal data)
 */
export interface StudentPreview {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
}

/**
 * Complete Enrollment entity
 */
export interface Enrollment {
  /** Unique enrollment ID */
  id: number;

  /** ID of the enrolled student */
  studentId: number;

  /** ID of the course */
  courseId: number;

  /** Current status of the enrollment */
  status: EnrollmentStatus;

  /** Date when the enrollment was created */
  enrolledAt: string;

  /** Date when the enrollment was last updated */
  updatedAt: string;

  /** Position in waitlist (null if not on waitlist) */
  waitlistPosition?: number | null;

  /** Optional notes from student or admin */
  notes?: string | null;

  /** Course details (populated in responses) */
  course?: CoursePreview;

  /** Student details (populated in admin responses) */
  student?: StudentPreview;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Data for creating a new enrollment
 */
export interface EnrollmentCreateDto {
  /** ID of the course to enroll in */
  courseId: number;

  /** Optional notes from the student */
  notes?: string;
}

/**
 * Data for updating an existing enrollment (admin only)
 */
export interface EnrollmentUpdateDto {
  /** New status for the enrollment */
  status?: EnrollmentStatus;

  /** Update notes */
  notes?: string;

  /** Update waitlist position */
  waitlistPosition?: number | null;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Result of an enrollment attempt
 * Contains information about the enrollment and waitlist status
 */
export interface EnrollmentResult {
  /** The created/updated enrollment */
  enrollment: Enrollment;

  /** Whether the student was placed on waitlist */
  isWaitlisted: boolean;

  /** Current waitlist position if waitlisted */
  waitlistPosition?: number;

  /** Message to display to the user */
  message: string;

  /** Whether the course is now full */
  isFull: boolean;
}

/**
 * Course capacity information
 */
export interface CourseCapacity {
  /** ID of the course */
  courseId: number;

  /** Current number of confirmed enrollments */
  currentCapacity: number;

  /** Maximum capacity of the course */
  maxCapacity: number;

  /** Number of available spots */
  availableSpots: number;

  /** Whether the course is full */
  isFull: boolean;

  /** Number of students on waitlist */
  waitlistCount: number;
}

// ============================================================================
// Filter & Query Types
// ============================================================================

/**
 * Filters for querying enrollments
 */
export interface EnrollmentFilters {
  /** Filter by enrollment status */
  status?: EnrollmentStatus | EnrollmentStatus[];

  /** Filter by course ID */
  courseId?: number;

  /** Filter by student ID (admin only) */
  studentId?: number;

  /** Include course details in response */
  includeCourse?: boolean;

  /** Include student details in response (admin only) */
  includeStudent?: boolean;

  /** Sort field */
  sortBy?: 'enrolledAt' | 'updatedAt' | 'status' | 'waitlistPosition';

  /** Sort order */
  sortOrder?: 'asc' | 'desc';

  /** Pagination: page number */
  page?: number;

  /** Pagination: items per page */
  limit?: number;
}

/**
 * Paginated response for enrollments
 */
export interface EnrollmentListResponse {
  /** List of enrollments */
  data: Enrollment[];

  /** Total number of enrollments matching the filters */
  total: number;

  /** Current page number */
  page: number;

  /** Number of items per page */
  limit: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a next page */
  hasNext: boolean;

  /** Whether there is a previous page */
  hasPrevious: boolean;
}

// ============================================================================
// Helper Types & Type Guards
// ============================================================================

/**
 * Type guard to check if enrollment is confirmed
 */
export const isConfirmed = (enrollment: Enrollment): boolean => {
  return enrollment.status === EnrollmentStatus.CONFIRMED;
};

/**
 * Type guard to check if enrollment is on waitlist
 */
export const isWaitlisted = (enrollment: Enrollment): boolean => {
  return enrollment.status === EnrollmentStatus.WAITLIST;
};

/**
 * Type guard to check if enrollment is pending
 */
export const isPending = (enrollment: Enrollment): boolean => {
  return enrollment.status === EnrollmentStatus.PENDING;
};

/**
 * Type guard to check if enrollment is cancelled
 */
export const isCancelled = (enrollment: Enrollment): boolean => {
  return enrollment.status === EnrollmentStatus.CANCELLED;
};

/**
 * Type guard to check if enrollment is rejected
 */
export const isRejected = (enrollment: Enrollment): boolean => {
  return enrollment.status === EnrollmentStatus.REJECTED;
};

/**
 * Type guard to check if enrollment is active (confirmed or pending)
 */
export const isActive = (enrollment: Enrollment): boolean => {
  return enrollment.status === EnrollmentStatus.CONFIRMED ||
         enrollment.status === EnrollmentStatus.PENDING;
};

/**
 * Helper to get human-readable status label
 */
export const getStatusLabel = (status: EnrollmentStatus): string => {
  const labels: Record<EnrollmentStatus, string> = {
    [EnrollmentStatus.CONFIRMED]: 'Confirmé',
    [EnrollmentStatus.PENDING]: 'En attente',
    [EnrollmentStatus.WAITLIST]: 'Liste d\'attente',
    [EnrollmentStatus.CANCELLED]: 'Annulé',
    [EnrollmentStatus.REJECTED]: 'Rejeté',
  };
  return labels[status];
};

/**
 * Helper to get status color for UI
 */
export const getStatusColor = (status: EnrollmentStatus): string => {
  const colors: Record<EnrollmentStatus, string> = {
    [EnrollmentStatus.CONFIRMED]: 'success',
    [EnrollmentStatus.PENDING]: 'warning',
    [EnrollmentStatus.WAITLIST]: 'info',
    [EnrollmentStatus.CANCELLED]: 'default',
    [EnrollmentStatus.REJECTED]: 'error',
  };
  return colors[status];
};

/**
 * Helper to format enrollment date
 */
export const formatEnrollmentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation errors for enrollment forms
 */
export interface EnrollmentValidationErrors {
  courseId?: string;
  notes?: string;
  general?: string;
}

/**
 * Enrollment statistics (for admin/professor)
 */
export interface EnrollmentStats {
  /** Total number of enrollments */
  total: number;

  /** Number of confirmed enrollments */
  confirmed: number;

  /** Number of pending enrollments */
  pending: number;

  /** Number of waitlisted students */
  waitlisted: number;

  /** Number of cancelled enrollments */
  cancelled: number;

  /** Number of rejected enrollments */
  rejected: number;

  /** Average enrollments per course */
  averagePerCourse: number;

  /** Most popular courses */
  popularCourses?: Array<{
    courseId: number;
    courseName: string;
    enrollmentCount: number;
  }>;
}
