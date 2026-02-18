import {
  useGetSessionEnrollmentsQuery,
  useGetUserEnrollmentsQuery,
  useEnrollUserMutation,
  useCancelEnrollmentMutation,
  useUpdateEnrollmentStatusMutation,
} from "@/lib/apollo/generated/graphql";
import type {
  GetSessionEnrollmentsQuery,
  GetUserEnrollmentsQuery,
} from "@/lib/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type Enrollment = NonNullable<
  GetSessionEnrollmentsQuery["sessionEnrollments"]
>[number];
type UserEnrollment = NonNullable<
  GetUserEnrollmentsQuery["userEnrollments"]
>[number];

type UseSessionEnrollmentsReturn = {
  enrollments: Enrollment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseUserEnrollmentsReturn = {
  enrollments: UserEnrollment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseEnrollUserReturn = {
  enrollUser: (userId: number, sessionId: number) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseCancelEnrollmentReturn = {
  cancelEnrollment: (enrollmentId: number) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseUpdateEnrollmentStatusReturn = {
  updateStatus: (enrollmentId: number, status: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch enrollments for a specific session
 *
 * @param sessionId - Session ID
 * @returns Enrollments list with loading state
 *
 * @example
 * ```tsx
 * const { enrollments, isLoading } = useSessionEnrollments(123);
 * ```
 */
export const useSessionEnrollments = (
  sessionId: number | undefined,
): UseSessionEnrollmentsReturn => {
  const { data, loading, error, refetch } = useGetSessionEnrollmentsQuery({
    variables: { sessionId: sessionId! },
    skip: !sessionId,
    fetchPolicy: "cache-and-network",
  });

  return {
    enrollments: data?.sessionEnrollments ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch all enrollments for a specific user
 *
 * @param userId - User ID
 * @returns User enrollments with loading state
 *
 * @example
 * ```tsx
 * const { enrollments, isLoading } = useUserEnrollments(456);
 * ```
 */
export const useUserEnrollments = (
  userId: number | undefined,
): UseUserEnrollmentsReturn => {
  const { data, loading, error, refetch } = useGetUserEnrollmentsQuery({
    variables: { userId: userId! },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  return {
    enrollments: data?.userEnrollments ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to enroll a user in a session
 *
 * @returns Enroll function with loading state
 *
 * @example
 * ```tsx
 * const { enrollUser, isLoading, success } = useEnrollUser();
 *
 * await enrollUser(456, 123); // userId, sessionId
 * ```
 */
export const useEnrollUser = (): UseEnrollUserReturn => {
  const [enrollUserMutation, { loading, error }] = useEnrollUserMutation();

  const enrollUser = async (
    userId: number,
    sessionId: number,
  ): Promise<void> => {
    console.log("📝 [useEnrollUser] Enrolling user:", { userId, sessionId });

    const result = await enrollUserMutation({
      variables: { userId, sessionId },
      refetchQueries: [
        "GetSessionEnrollments",
        "GetUserEnrollments",
        "GetSessions",
      ],
    });

    if (!result.data?.enrollUser) {
      throw new Error("Enrollment failed");
    }

    console.log("✅ [useEnrollUser] User enrolled:", result.data.enrollUser.id);
  };

  return {
    enrollUser,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to cancel an enrollment
 *
 * @returns Cancel function with loading state
 *
 * @example
 * ```tsx
 * const { cancelEnrollment, isLoading } = useCancelEnrollment();
 *
 * await cancelEnrollment(789);
 * ```
 */
export const useCancelEnrollment = (): UseCancelEnrollmentReturn => {
  const [cancelEnrollmentMutation, { loading, error }] =
    useCancelEnrollmentMutation();

  const cancelEnrollment = async (enrollmentId: number): Promise<void> => {
    console.log("🗑️ [useCancelEnrollment] Canceling enrollment:", enrollmentId);

    const result = await cancelEnrollmentMutation({
      variables: { enrollmentId },
      refetchQueries: [
        "GetSessionEnrollments",
        "GetUserEnrollments",
        "GetSessions",
      ],
    });

    if (!result.data?.cancelEnrollment?.success) {
      throw new Error(
        result.data?.cancelEnrollment?.message ||
          "Enrollment cancellation failed",
      );
    }

    console.log("✅ [useCancelEnrollment] Enrollment canceled:", enrollmentId);
  };

  return {
    cancelEnrollment,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to update enrollment status (validate/cancel presence)
 *
 * @returns Update status function with loading state
 *
 * @example
 * ```tsx
 * const { updateStatus, isLoading } = useUpdateEnrollmentStatus();
 *
 * await updateStatus(789, 'confirmed');
 * await updateStatus(789, 'cancelled');
 * ```
 */
export const useUpdateEnrollmentStatus =
  (): UseUpdateEnrollmentStatusReturn => {
    const [updateEnrollmentStatusMutation, { loading, error }] =
      useUpdateEnrollmentStatusMutation();

    const updateStatus = async (
      enrollmentId: number,
      status: string,
    ): Promise<void> => {
      console.log("📝 [useUpdateEnrollmentStatus] Updating status:", {
        enrollmentId,
        status,
      });

      const result = await updateEnrollmentStatusMutation({
        variables: { enrollmentId, status },
        refetchQueries: [
          "GetSessionEnrollments",
          "GetUserEnrollments",
          "GetSessions",
        ],
      });

      if (!result.data?.updateEnrollmentStatus) {
        throw new Error("Enrollment status update failed");
      }

      console.log(
        "✅ [useUpdateEnrollmentStatus] Status updated:",
        result.data.updateEnrollmentStatus.id,
      );
    };

    return {
      updateStatus,
      isLoading: loading,
      error: error ?? null,
      success: !loading && !error,
    };
  };

/**
 * Hook to validate user presence at a session
 *
 * @returns Validate function
 *
 * @example
 * ```tsx
 * const { validatePresence } = useValidatePresence();
 * await validatePresence(789);
 * ```
 */
export const useValidatePresence = () => {
  const { updateStatus, isLoading, error, success } =
    useUpdateEnrollmentStatus();

  const validatePresence = async (enrollmentId: number): Promise<void> => {
    await updateStatus(enrollmentId, "confirmed");
  };

  return {
    validatePresence,
    isLoading,
    error,
    success,
  };
};

/**
 * Hook to cancel user presence at a session
 *
 * @returns Cancel function
 *
 * @example
 * ```tsx
 * const { cancelPresence } = useCancelPresence();
 * await cancelPresence(789);
 * ```
 */
export const useCancelPresence = () => {
  const { updateStatus, isLoading, error, success } =
    useUpdateEnrollmentStatus();

  const cancelPresence = async (enrollmentId: number): Promise<void> => {
    await updateStatus(enrollmentId, "cancelled");
  };

  return {
    cancelPresence,
    isLoading,
    error,
    success,
  };
};

/**
 * Legacy alias for useUserEnrollments
 * @deprecated Use useUserEnrollments instead
 */
export const useInscriptionsUtilisateur = useUserEnrollments;

/**
 * Legacy alias for useSessionEnrollments
 * @deprecated Use useSessionEnrollments instead
 */
export const useInscriptionsCours = useSessionEnrollments;

/**
 * Legacy alias for useEnrollUser
 * @deprecated Use useEnrollUser instead
 */
export const useInscrireUtilisateurCours = useEnrollUser;

/**
 * Legacy alias for useCancelEnrollment
 * @deprecated Use useCancelEnrollment instead
 */
export const useAnnulerInscription = useCancelEnrollment;

/**
 * Legacy alias for useValidatePresence
 * @deprecated Use useValidatePresence instead
 */
export const useValiderPresence = useValidatePresence;

/**
 * Legacy alias for useCancelPresence
 * @deprecated Use useCancelPresence instead
 */
export const useAnnulerPresence = useCancelPresence;
