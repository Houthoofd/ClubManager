/**
 * Enrollment Feature - API Layer
 *
 * Handles all HTTP requests related to course enrollments.
 * Uses the httpClient and returns Result for type-safe error handling.
 */

import { httpClient } from '@/shared/api/client';
import type { ApiResult } from '@/shared/api/client';
import type {
  Enrollment,
  EnrollmentCreateDto,
  EnrollmentUpdateDto,
  EnrollmentResult,
  CourseCapacity,
  EnrollmentFilters,
  EnrollmentListResponse,
  EnrollmentStats,
} from '../model/types';

// ============================================================================
// Enrollment API
// ============================================================================

export const enrollmentApi = {
  /**
   * Enroll in a course
   *
   * @param courseId - ID of the course to enroll in
   * @param notes - Optional notes from the student
   * @returns Result containing enrollment details and waitlist status
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.enroll(123, 'Looking forward to this course!');
   * result.match(
   *   (data) => {
   *     if (data.isWaitlisted) {
   *       console.log('Added to waitlist at position:', data.waitlistPosition);
   *     } else {
   *       console.log('Enrolled successfully!');
   *     }
   *   },
   *   (error) => console.error('Enrollment failed:', error.message)
   * );
   * ```
   */
  enroll: async (
    courseId: number,
    notes?: string
  ): Promise<ApiResult<EnrollmentResult>> => {
    const data: EnrollmentCreateDto = { courseId, notes };
    return httpClient.post<EnrollmentResult>('enrollments', data);
  },

  /**
   * Unenroll from a course (cancel enrollment)
   *
   * @param enrollmentId - ID of the enrollment to cancel
   * @returns Result confirming cancellation
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.unenroll(456);
   * result.match(
   *   () => console.log('Unenrolled successfully'),
   *   (error) => console.error('Failed to unenroll:', error.message)
   * );
   * ```
   */
  unenroll: async (enrollmentId: number): Promise<ApiResult<void>> => {
    return httpClient.delete<void>(`enrollments/${enrollmentId}`);
  },

  /**
   * Get current user's enrollments
   *
   * @param filters - Optional filters for the query
   * @returns Result containing list of enrollments
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.getMyEnrollments({
   *   status: EnrollmentStatus.CONFIRMED,
   *   includeCourse: true
   * });
   * ```
   */
  getMyEnrollments: async (
    filters?: EnrollmentFilters
  ): Promise<ApiResult<Enrollment[]>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          filters.status.forEach(s => params.append('status', s));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters.courseId) params.append('courseId', filters.courseId.toString());
      if (filters.includeCourse) params.append('includeCourse', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `enrollments/my?${queryString}` : 'enrollments/my';

    return httpClient.get<Enrollment[]>(endpoint);
  },

  /**
   * Get a specific enrollment by ID
   *
   * @param enrollmentId - ID of the enrollment
   * @returns Result containing the enrollment
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.getEnrollment(123);
   * result.match(
   *   (enrollment) => console.log('Enrollment:', enrollment),
   *   (error) => console.error('Not found:', error.message)
   * );
   * ```
   */
  getEnrollment: async (enrollmentId: number): Promise<ApiResult<Enrollment>> => {
    return httpClient.get<Enrollment>(`enrollments/${enrollmentId}`);
  },

  /**
   * Get course capacity information
   *
   * @param courseId - ID of the course
   * @returns Result containing capacity details
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.getCourseCapacity(123);
   * result.match(
   *   (capacity) => {
   *     console.log(`${capacity.currentCapacity}/${capacity.maxCapacity} enrolled`);
   *     console.log(`${capacity.availableSpots} spots available`);
   *   },
   *   (error) => console.error('Error:', error.message)
   * );
   * ```
   */
  getCourseCapacity: async (courseId: number): Promise<ApiResult<CourseCapacity>> => {
    return httpClient.get<CourseCapacity>(`enrollments/courses/${courseId}/capacity`);
  },

  /**
   * Update an enrollment (admin only)
   *
   * @param enrollmentId - ID of the enrollment to update
   * @param data - Update data
   * @returns Result containing the updated enrollment
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.updateEnrollment(123, {
   *   status: EnrollmentStatus.CONFIRMED,
   *   notes: 'Approved'
   * });
   * ```
   */
  updateEnrollment: async (
    enrollmentId: number,
    data: EnrollmentUpdateDto
  ): Promise<ApiResult<Enrollment>> => {
    return httpClient.patch<Enrollment>(`enrollments/${enrollmentId}`, data);
  },

  /**
   * Get all enrollments (admin/professor only)
   *
   * @param filters - Filters for the query
   * @returns Result containing paginated list of enrollments
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.getAllEnrollments({
   *   courseId: 123,
   *   includeStudent: true,
   *   page: 1,
   *   limit: 20
   * });
   * ```
   */
  getAllEnrollments: async (
    filters?: EnrollmentFilters
  ): Promise<ApiResult<EnrollmentListResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          filters.status.forEach(s => params.append('status', s));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters.courseId) params.append('courseId', filters.courseId.toString());
      if (filters.studentId) params.append('studentId', filters.studentId.toString());
      if (filters.includeCourse) params.append('includeCourse', 'true');
      if (filters.includeStudent) params.append('includeStudent', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `enrollments?${queryString}` : 'enrollments';

    return httpClient.get<EnrollmentListResponse>(endpoint);
  },

  /**
   * Get enrollments for a specific course (admin/professor only)
   *
   * @param courseId - ID of the course
   * @param filters - Optional filters
   * @returns Result containing list of enrollments
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.getCourseEnrollments(123, {
   *   status: EnrollmentStatus.CONFIRMED,
   *   includeStudent: true
   * });
   * ```
   */
  getCourseEnrollments: async (
    courseId: number,
    filters?: Omit<EnrollmentFilters, 'courseId'>
  ): Promise<ApiResult<Enrollment[]>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          filters.status.forEach(s => params.append('status', s));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters.studentId) params.append('studentId', filters.studentId.toString());
      if (filters.includeCourse) params.append('includeCourse', 'true');
      if (filters.includeStudent) params.append('includeStudent', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `enrollments/courses/${courseId}?${queryString}`
      : `enrollments/courses/${courseId}`;

    return httpClient.get<Enrollment[]>(endpoint);
  },

  /**
   * Get enrollment statistics (admin only)
   *
   * @param courseId - Optional course ID to filter stats
   * @returns Result containing enrollment statistics
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.getStats();
   * result.match(
   *   (stats) => console.log('Total enrollments:', stats.total),
   *   (error) => console.error('Error:', error.message)
   * );
   * ```
   */
  getStats: async (courseId?: number): Promise<ApiResult<EnrollmentStats>> => {
    const endpoint = courseId
      ? `enrollments/stats?courseId=${courseId}`
      : 'enrollments/stats';
    return httpClient.get<EnrollmentStats>(endpoint);
  },

  /**
   * Approve a pending enrollment (admin/professor only)
   *
   * @param enrollmentId - ID of the enrollment to approve
   * @returns Result containing the updated enrollment
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.approveEnrollment(123);
   * ```
   */
  approveEnrollment: async (enrollmentId: number): Promise<ApiResult<Enrollment>> => {
    return httpClient.post<Enrollment>(`enrollments/${enrollmentId}/approve`);
  },

  /**
   * Reject a pending enrollment (admin/professor only)
   *
   * @param enrollmentId - ID of the enrollment to reject
   * @param reason - Reason for rejection
   * @returns Result containing the updated enrollment
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.rejectEnrollment(123, 'Prerequisites not met');
   * ```
   */
  rejectEnrollment: async (
    enrollmentId: number,
    reason?: string
  ): Promise<ApiResult<Enrollment>> => {
    return httpClient.post<Enrollment>(`enrollments/${enrollmentId}/reject`, {
      reason,
    });
  },

  /**
   * Move student from waitlist to enrolled (admin/professor only)
   *
   * @param enrollmentId - ID of the waitlisted enrollment
   * @returns Result containing the updated enrollment
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.promoteFromWaitlist(123);
   * ```
   */
  promoteFromWaitlist: async (enrollmentId: number): Promise<ApiResult<Enrollment>> => {
    return httpClient.post<Enrollment>(`enrollments/${enrollmentId}/promote`);
  },

  /**
   * Check if user is enrolled in a course
   *
   * @param courseId - ID of the course
   * @returns Result containing enrollment status
   *
   * @example
   * ```ts
   * const result = await enrollmentApi.checkEnrollment(123);
   * result.match(
   *   (data) => console.log('Enrolled:', data.isEnrolled),
   *   (error) => console.error('Error:', error.message)
   * );
   * ```
   */
  checkEnrollment: async (
    courseId: number
  ): Promise<ApiResult<{ isEnrolled: boolean; enrollment?: Enrollment }>> => {
    return httpClient.get<{ isEnrolled: boolean; enrollment?: Enrollment }>(
      `enrollments/check/${courseId}`
    );
  },
};

// ============================================================================
// Exports
// ============================================================================

export default enrollmentApi;
