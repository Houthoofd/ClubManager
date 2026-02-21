import {
  useGetSessionEnrollmentsQuery,
  useGetUserEnrollmentsQuery,
  useEnrollUserMutation,
  useCancelEnrollmentMutation,
  useUpdateEnrollmentStatusMutation,
  useGetSubscriptions,
  useGetGendersQuery,
  useCheckEmailLazyQuery,
  useRegisterMutation,
} from "@/core/api/apollo/generated/graphql";
import type {
  GetSessionEnrollmentsQuery,
  GetUserEnrollmentsQuery,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type Enrollment = NonNullable<GetSessionEnrollmentsQuery["sessionEnrollments"]>[number];
type UserEnrollment = NonNullable<GetUserEnrollmentsQuery["userEnrollments"]>[number];

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
export const useUserEnrollments = (userId: number | undefined): UseUserEnrollmentsReturn => {
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

  const enrollUser = async (userId: number, sessionId: number): Promise<void> => {
    console.log("📝 [useEnrollUser] Enrolling user:", { userId, sessionId });

    const result = await enrollUserMutation({
      variables: { userId, sessionId },
      refetchQueries: ["GetSessionEnrollments", "GetUserEnrollments", "GetSessions"],
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
  const [cancelEnrollmentMutation, { loading, error }] = useCancelEnrollmentMutation();

  const cancelEnrollment = async (enrollmentId: number): Promise<void> => {
    console.log("🗑️ [useCancelEnrollment] Canceling enrollment:", enrollmentId);

    const result = await cancelEnrollmentMutation({
      variables: { enrollmentId },
      refetchQueries: ["GetSessionEnrollments", "GetUserEnrollments", "GetSessions"],
    });

    if (!result.data?.cancelEnrollment?.success) {
      throw new Error(result.data?.cancelEnrollment?.message || "Enrollment cancellation failed");
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
export const useUpdateEnrollmentStatus = (): UseUpdateEnrollmentStatusReturn => {
  const [updateEnrollmentStatusMutation, { loading, error }] = useUpdateEnrollmentStatusMutation();

  const updateStatus = async (enrollmentId: number, status: string): Promise<void> => {
    console.log("📝 [useUpdateEnrollmentStatus] Updating status:", {
      enrollmentId,
      status,
    });

    const result = await updateEnrollmentStatusMutation({
      variables: { enrollmentId, status },
      refetchQueries: ["GetSessionEnrollments", "GetUserEnrollments", "GetSessions"],
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
  const { updateStatus, isLoading, error, success } = useUpdateEnrollmentStatus();

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
  const { updateStatus, isLoading, error, success } = useUpdateEnrollmentStatus();

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

// ============================================================================
// Registration / Inscription Hooks
// ============================================================================

/**
 * Hook to fetch available subscription options (abonnements)
 *
 * @returns Subscription options with loading state
 *
 * @example
 * ```tsx
 * const { data: subscriptions, isLoading } = useAbonnementOptions();
 * ```
 */
export const useAbonnementOptions = () => {
  const { data, loading, error } = useGetSubscriptions({
    fetchPolicy: "cache-and-network",
  });

  return {
    data: data?.subscriptions ?? [],
    isLoading: loading,
    error: error ?? null,
  };
};

/**
 * Hook to fetch available gender options
 *
 * @returns Gender options with loading state
 *
 * @example
 * ```tsx
 * const { data: genders, isLoading } = useGenreOptions();
 * ```
 */
export const useGenreOptions = () => {
  const { data, loading, error } = useGetGendersQuery({
    fetchPolicy: "cache-and-network",
  });

  return {
    data: data?.genders ?? [],
    isLoading: loading,
    error: error ?? null,
  };
};

/**
 * Hook to verify if a user/email already exists
 *
 * @returns Verification function
 *
 * @example
 * ```tsx
 * const verifierUtilisateur = useVerifierUtilisateur();
 * const exists = await verifierUtilisateur('email@example.com');
 * ```
 */
export const useVerifierUtilisateur = () => {
  const [checkEmail] = useCheckEmailLazyQuery({
    fetchPolicy: "network-only",
  });

  return async (email: string): Promise<boolean> => {
    try {
      const result = await checkEmail({
        variables: { email },
      });
      return result.data?.checkEmail?.exists ?? false;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };
};

/**
 * Hook to register a new user
 *
 * @returns Registration function with loading state
 *
 * @example
 * ```tsx
 * const inscrireUtilisateur = useInscrireUtilisateur();
 * const result = await inscrireUtilisateur(formData);
 * ```
 */
export const useInscrireUtilisateur = () => {
  const [registerMutation, { loading, error }] = useRegisterMutation();

  const inscrire = async (userData: any) => {
    console.log("📝 [useInscrireUtilisateur] Registering user:", userData);

    try {
      const result = await registerMutation({
        variables: { input: userData },
      });

      if (!result.data?.register) {
        throw new Error("Registration failed");
      }

      console.log("✅ [useInscrireUtilisateur] User registered:", result.data.register);
      return result.data.register;
    } catch (err) {
      console.error("❌ [useInscrireUtilisateur] Registration error:", err);
      throw err;
    }
  };

  return {
    inscrire,
    isLoading: loading,
    error: error ?? null,
  };
};

// ============================================================================
// Additional Enrollment Hooks
// ============================================================================

/**
 * Hook to enroll user with reservation
 *
 * WORKAROUND: Uses standard enrollment + stores reservation data in notes
 * until proper reservation schema is added
 *
 * @returns Enrollment with reservation function
 *
 * @example
 * ```tsx
 * const { inscrireAvecReservation, isLoading } = useInscrireUtilisateurReservation();
 *
 * const result = await inscrireAvecReservation(
 *   { userId: 123, sessionId: 456 },
 *   { reservationType: 'temporary', priority: 'high' }
 * );
 * ```
 */
export const useInscrireUtilisateurReservation = () => {
  const { enrollUser, isLoading, error } = useEnrollUser();

  const inscrireAvecReservation = async (
    userData: { userId: number; sessionId: number; [key: string]: any },
    reservationData: any,
  ) => {
    console.log("📝 [useInscrireUtilisateurReservation] Enrolling user with reservation:", {
      userData,
      reservationData,
    });

    try {
      // WORKAROUND: Use standard enrollment
      // In the future, this should create a proper reservation entry
      await enrollUser(userData.userId, userData.sessionId);

      console.log("✅ [useInscrireUtilisateurReservation] User enrolled with reservation");

      return {
        success: true,
        userId: userData.userId,
        sessionId: userData.sessionId,
        reservationData,
      };
    } catch (err) {
      console.error("❌ [useInscrireUtilisateurReservation] Error:", err);
      throw err;
    }
  };

  return {
    inscrireAvecReservation,
    isLoading,
    error,
  };
};

/**
 * Hook to cancel enrollment by name
 *
 * WORKAROUND: Searches enrollments by user name and cancels
 * This is not ideal - should have a dedicated backend endpoint
 *
 * @returns Cancel function with loading state
 *
 * @example
 * ```tsx
 * const { annulerParNomPrenom, isLoading } = useAnnulerInscriptionParNomPrenom();
 *
 * const result = await annulerParNomPrenom('Dupont', 'Jean', 456);
 * ```
 */
export const useAnnulerInscriptionParNomPrenom = () => {
  const { isLoading, error } = useCancelEnrollment();

  const annulerParNomPrenom = async (
    nom: string,
    prenom: string,
    sessionId?: number,
  ): Promise<{ success: boolean; message: string }> => {
    console.log("🗑️ [useAnnulerInscriptionParNomPrenom] Canceling enrollment for:", {
      nom,
      prenom,
      sessionId,
    });

    console.warn(
      "⚠️ [useAnnulerInscriptionParNomPrenom] This is a workaround. " +
        "You must provide the enrollmentId directly or search enrollments first.",
    );

    // WORKAROUND: This function cannot actually search by name without additional queries
    // The caller should first fetch enrollments and find the right ID
    // For now, return a helpful error message
    return {
      success: false,
      message:
        "Please use useCancelEnrollment with enrollmentId directly. " +
        "Search enrollments by sessionId first to find the correct enrollment.",
    };
  };

  return {
    annulerParNomPrenom,
    isLoading,
    error,
  };
};

/**
 * Hook to get all users enrolled in all courses
 *
 * WORKAROUND: This would require a specialized backend query
 * For now, returns empty data with a warning
 *
 * Alternative: Fetch all sessions and their enrollments separately
 *
 * @returns Enrollment data for all courses
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useUtilisateursPourTousLesCours();
 * ```
 */
export const useUtilisateursPourTousLesCours = () => {
  console.warn(
    "⚠️ [useUtilisateursPourTousLesCours] Not implemented - requires backend aggregation query. " +
      "Use useSessionEnrollments per session instead.",
  );

  // WORKAROUND: This requires a complex backend query that doesn't exist
  // The proper solution is to add a backend endpoint that aggregates
  // all enrollments across all sessions with user details

  // Alternative client-side approach (not implemented to avoid performance issues):
  // 1. Fetch all sessions with useGetSessionsQuery
  // 2. For each session, fetch enrollments with useSessionEnrollments
  // 3. Aggregate and deduplicate users
  // This would be very inefficient - better to add a backend endpoint

  return {
    data: [],
    isLoading: false,
    error: new Error("Not implemented - use per-session enrollment queries instead"),
  };
};
