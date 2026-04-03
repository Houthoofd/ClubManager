/**
 * Enrollment Feature - React Query Hooks
 *
 * Provides React Query hooks for managing enrollments.
 * Handles enrolling, unenrolling, fetching enrollments, and capacity checks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentApi } from '../api/enrollmentApi';
import type {
  Enrollment,
  EnrollmentFilters,
  EnrollmentStatus,
  CourseCapacity,
  EnrollmentUpdateDto,
} from './types';

// ============================================================================
// Query Keys
// ============================================================================

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  list: (filters?: EnrollmentFilters) => [...enrollmentKeys.lists(), filters] as const,
  myEnrollments: (filters?: EnrollmentFilters) => [...enrollmentKeys.all, 'my', filters] as const,
  details: () => [...enrollmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...enrollmentKeys.details(), id] as const,
  capacity: (courseId: number) => [...enrollmentKeys.all, 'capacity', courseId] as const,
  check: (courseId: number) => [...enrollmentKeys.all, 'check', courseId] as const,
  courseEnrollments: (courseId: number, filters?: EnrollmentFilters) =>
    [...enrollmentKeys.all, 'course', courseId, filters] as const,
  stats: (courseId?: number) => [...enrollmentKeys.all, 'stats', courseId] as const,
};

// ============================================================================
// useEnroll Hook
// ============================================================================

/**
 * Hook for enrolling in a course
 *
 * @example
 * ```tsx
 * const { mutate: enroll, isPending } = useEnroll();
 *
 * const handleEnroll = () => {
 *   enroll({ courseId: 123, notes: 'Looking forward to this!' }, {
 *     onSuccess: (data) => {
 *       if (data.isWaitlisted) {
 *         alert(`Added to waitlist at position ${data.waitlistPosition}`);
 *       } else {
 *         alert('Enrolled successfully!');
 *       }
 *     }
 *   });
 * };
 * ```
 */
export const useEnroll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, notes }: { courseId: number; notes?: string }) => {
      const result = await enrollmentApi.enroll(courseId, notes);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: (data) => {
      // Invalidate all enrollment queries
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });

      // Invalidate course capacity
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.capacity(data.enrollment.courseId)
      });

      // Invalidate enrollment check for this course
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.check(data.enrollment.courseId)
      });
    },
    onError: (error: Error) => {
      console.error('Enrollment error:', error);
    },
  });
};

// ============================================================================
// useUnenroll Hook
// ============================================================================

/**
 * Hook for unenrolling from a course
 *
 * @example
 * ```tsx
 * const { mutate: unenroll, isPending } = useUnenroll();
 *
 * const handleUnenroll = () => {
 *   unenroll({ enrollmentId: 123, courseId: 456 }, {
 *     onSuccess: () => {
 *       alert('Unenrolled successfully');
 *     }
 *   });
 * };
 * ```
 */
export const useUnenroll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      courseId
    }: {
      enrollmentId: number;
      courseId: number;
    }) => {
      const result = await enrollmentApi.unenroll(enrollmentId);
      return result.match(
        () => ({ enrollmentId, courseId }),
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: (data) => {
      // Invalidate all enrollment queries
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });

      // Invalidate course capacity
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.capacity(data.courseId)
      });

      // Invalidate enrollment check for this course
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.check(data.courseId)
      });
    },
    onError: (error: Error) => {
      console.error('Unenroll error:', error);
    },
  });
};

// ============================================================================
// useMyEnrollments Hook
// ============================================================================

/**
 * Hook to fetch the current user's enrollments
 *
 * @param filters - Optional filters for the query
 *
 * @example
 * ```tsx
 * const { data: enrollments, isLoading } = useMyEnrollments({
 *   status: EnrollmentStatus.CONFIRMED,
 *   includeCourse: true
 * });
 * ```
 */
export const useMyEnrollments = (filters?: EnrollmentFilters) => {
  return useQuery({
    queryKey: enrollmentKeys.myEnrollments(filters),
    queryFn: async () => {
      const result = await enrollmentApi.getMyEnrollments(filters);
      return result.match(
        (data) => data,
        (error) => {
          console.error('Error fetching my enrollments:', error);
          throw new Error(error.message);
        }
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// ============================================================================
// useEnrollment Hook
// ============================================================================

/**
 * Hook to fetch a specific enrollment by ID
 *
 * @param enrollmentId - ID of the enrollment
 * @param options - Query options
 *
 * @example
 * ```tsx
 * const { data: enrollment, isLoading } = useEnrollment(123);
 * ```
 */
export const useEnrollment = (
  enrollmentId: number | null | undefined,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: enrollmentKeys.detail(enrollmentId!),
    queryFn: async () => {
      const result = await enrollmentApi.getEnrollment(enrollmentId!);
      return result.match(
        (data) => data,
        (error) => {
          console.error('Error fetching enrollment:', error);
          throw new Error(error.message);
        }
      );
    },
    enabled: enrollmentId != null && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// ============================================================================
// useCourseCapacity Hook
// ============================================================================

/**
 * Hook to fetch course capacity information
 *
 * @param courseId - ID of the course
 * @param options - Query options
 *
 * @example
 * ```tsx
 * const { data: capacity, isLoading } = useCourseCapacity(123);
 *
 * if (capacity?.isFull) {
 *   console.log('Course is full!');
 * }
 * ```
 */
export const useCourseCapacity = (
  courseId: number | null | undefined,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  return useQuery({
    queryKey: enrollmentKeys.capacity(courseId!),
    queryFn: async () => {
      const result = await enrollmentApi.getCourseCapacity(courseId!);
      return result.match(
        (data) => data,
        (error) => {
          console.error('Error fetching course capacity:', error);
          throw new Error(error.message);
        }
      );
    },
    enabled: courseId != null && (options?.enabled ?? true),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: options?.refetchInterval,
    retry: 2,
  });
};

// ============================================================================
// useCheckEnrollment Hook
// ============================================================================

/**
 * Hook to check if user is enrolled in a course
 *
 * @param courseId - ID of the course
 * @param options - Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCheckEnrollment(123);
 *
 * if (data?.isEnrolled) {
 *   console.log('Already enrolled!', data.enrollment);
 * }
 * ```
 */
export const useCheckEnrollment = (
  courseId: number | null | undefined,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: enrollmentKeys.check(courseId!),
    queryFn: async () => {
      const result = await enrollmentApi.checkEnrollment(courseId!);
      return result.match(
        (data) => data,
        (error) => {
          console.error('Error checking enrollment:', error);
          throw new Error(error.message);
        }
      );
    },
    enabled: courseId != null && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// ============================================================================
// useUpdateEnrollment Hook (Admin)
// ============================================================================

/**
 * Hook for updating an enrollment (admin only)
 *
 * @example
 * ```tsx
 * const { mutate: updateEnrollment } = useUpdateEnrollment();
 *
 * updateEnrollment({
 *   enrollmentId: 123,
 *   data: { status: EnrollmentStatus.CONFIRMED }
 * });
 * ```
 */
export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      data,
    }: {
      enrollmentId: number;
      data: EnrollmentUpdateDto;
    }) => {
      const result = await enrollmentApi.updateEnrollment(enrollmentId, data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: (enrollment) => {
      // Invalidate all enrollment queries
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });

      // Update the specific enrollment in cache
      queryClient.setQueryData(
        enrollmentKeys.detail(enrollment.id),
        enrollment
      );
    },
    onError: (error: Error) => {
      console.error('Update enrollment error:', error);
    },
  });
};

// ============================================================================
// useCourseEnrollments Hook (Admin/Professor)
// ============================================================================

/**
 * Hook to fetch enrollments for a specific course (admin/professor)
 *
 * @param courseId - ID of the course
 * @param filters - Optional filters
 *
 * @example
 * ```tsx
 * const { data: enrollments } = useCourseEnrollments(123, {
 *   status: EnrollmentStatus.CONFIRMED,
 *   includeStudent: true
 * });
 * ```
 */
export const useCourseEnrollments = (
  courseId: number | null | undefined,
  filters?: Omit<EnrollmentFilters, 'courseId'>
) => {
  return useQuery({
    queryKey: enrollmentKeys.courseEnrollments(courseId!, filters),
    queryFn: async () => {
      const result = await enrollmentApi.getCourseEnrollments(courseId!, filters);
      return result.match(
        (data) => data,
        (error) => {
          console.error('Error fetching course enrollments:', error);
          throw new Error(error.message);
        }
      );
    },
    enabled: courseId != null,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// ============================================================================
// useApproveEnrollment Hook (Admin/Professor)
// ============================================================================

/**
 * Hook for approving a pending enrollment
 *
 * @example
 * ```tsx
 * const { mutate: approve } = useApproveEnrollment();
 *
 * approve(123);
 * ```
 */
export const useApproveEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: number) => {
      const result = await enrollmentApi.approveEnrollment(enrollmentId);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
      queryClient.setQueryData(
        enrollmentKeys.detail(enrollment.id),
        enrollment
      );
    },
  });
};

// ============================================================================
// useRejectEnrollment Hook (Admin/Professor)
// ============================================================================

/**
 * Hook for rejecting a pending enrollment
 *
 * @example
 * ```tsx
 * const { mutate: reject } = useRejectEnrollment();
 *
 * reject({ enrollmentId: 123, reason: 'Prerequisites not met' });
 * ```
 */
export const useRejectEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      reason,
    }: {
      enrollmentId: number;
      reason?: string;
    }) => {
      const result = await enrollmentApi.rejectEnrollment(enrollmentId, reason);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
      queryClient.setQueryData(
        enrollmentKeys.detail(enrollment.id),
        enrollment
      );
    },
  });
};

// ============================================================================
// usePromoteFromWaitlist Hook (Admin/Professor)
// ============================================================================

/**
 * Hook for promoting a student from waitlist
 *
 * @example
 * ```tsx
 * const { mutate: promote } = usePromoteFromWaitlist();
 *
 * promote(123);
 * ```
 */
export const usePromoteFromWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: number) => {
      const result = await enrollmentApi.promoteFromWaitlist(enrollmentId);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.capacity(enrollment.courseId)
      });
      queryClient.setQueryData(
        enrollmentKeys.detail(enrollment.id),
        enrollment
      );
    },
  });
};

// ============================================================================
// useEnrollmentStats Hook (Admin)
// ============================================================================

/**
 * Hook to fetch enrollment statistics
 *
 * @param courseId - Optional course ID to filter stats
 *
 * @example
 * ```tsx
 * const { data: stats } = useEnrollmentStats();
 *
 * console.log('Total enrollments:', stats?.total);
 * ```
 */
export const useEnrollmentStats = (courseId?: number) => {
  return useQuery({
    queryKey: enrollmentKeys.stats(courseId),
    queryFn: async () => {
      const result = await enrollmentApi.getStats(courseId);
      return result.match(
        (data) => data,
        (error) => {
          console.error('Error fetching enrollment stats:', error);
          throw new Error(error.message);
        }
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
