import {
  useGetSessionEnrollmentsQuery,
  useGetUserEnrollmentsQuery,
} from "@/core/api/apollo/generated/graphql";
import type {
  GetSessionEnrollmentsQuery,
  GetUserEnrollmentsQuery,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type Participant = NonNullable<
  GetSessionEnrollmentsQuery["sessionEnrollments"]
>[number];

type UseParticipantsReturn = {
  participants: Participant[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  count: number;
};

type UseUserSessionsReturn = {
  sessions: NonNullable<GetUserEnrollmentsQuery["userEnrollments"]>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  count: number;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch participants for a specific session
 *
 * Returns all users enrolled in a session
 *
 * @param sessionId - Session ID
 * @returns Participants list with loading state
 *
 * @example
 * ```tsx
 * const { participants, count, isLoading } = useParticipants(123);
 * console.log(`${count} participants enrolled`);
 * ```
 */
export const useParticipants = (
  sessionId: number | undefined,
): UseParticipantsReturn => {
  const { data, loading, error, refetch } = useGetSessionEnrollmentsQuery({
    variables: { sessionId: sessionId! },
    skip: !sessionId,
    fetchPolicy: "cache-and-network",
  });

  return {
    participants: data?.sessionEnrollments ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
    count: data?.sessionEnrollments?.length ?? 0,
  };
};

/**
 * Hook to fetch all sessions for a specific user (participant view)
 *
 * Returns all sessions where the user is enrolled
 *
 * @param userId - User ID
 * @returns User's enrolled sessions with loading state
 *
 * @example
 * ```tsx
 * const { sessions, count, isLoading } = useUserSessions(456);
 * ```
 */
export const useUserSessions = (
  userId: number | undefined,
): UseUserSessionsReturn => {
  const { data, loading, error, refetch } = useGetUserEnrollmentsQuery({
    variables: { userId: userId! },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  return {
    sessions: data?.userEnrollments ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
    count: data?.userEnrollments?.length ?? 0,
  };
};

/**
 * Hook to fetch participant count for a session
 *
 * @param sessionId - Session ID
 * @returns Participant count
 *
 * @example
 * ```tsx
 * const { count, isLoading } = useParticipantCount(123);
 * ```
 */
export const useParticipantCount = (
  sessionId: number | undefined,
): { count: number; isLoading: boolean } => {
  const { data, loading } = useGetSessionEnrollmentsQuery({
    variables: { sessionId: sessionId! },
    skip: !sessionId,
    fetchPolicy: "cache-only",
  });

  return {
    count: data?.sessionEnrollments?.length ?? 0,
    isLoading: loading,
  };
};

/**
 * Hook to check if a user is enrolled in a session
 *
 * @param sessionId - Session ID
 * @param userId - User ID
 * @returns Boolean indicating enrollment status
 *
 * @example
 * ```tsx
 * const { isEnrolled, isLoading } = useIsUserEnrolled(123, 456);
 * ```
 */
export const useIsUserEnrolled = (
  sessionId: number | undefined,
  userId: number | undefined,
): { isEnrolled: boolean; isLoading: boolean } => {
  const { data, loading } = useGetSessionEnrollmentsQuery({
    variables: { sessionId: sessionId! },
    skip: !sessionId || !userId,
    fetchPolicy: "cache-first",
  });

  const isEnrolled =
    data?.sessionEnrollments?.some(
      (enrollment) => enrollment.user_id === userId,
    ) ?? false;

  return {
    isEnrolled,
    isLoading: loading,
  };
};

/**
 * Hook to get confirmed participants only
 *
 * Filters participants by confirmed status
 *
 * @param sessionId - Session ID
 * @returns Confirmed participants
 *
 * @example
 * ```tsx
 * const { participants, count } = useConfirmedParticipants(123);
 * ```
 */
export const useConfirmedParticipants = (
  sessionId: number | undefined,
): UseParticipantsReturn => {
  const { data, loading, error, refetch } = useGetSessionEnrollmentsQuery({
    variables: { sessionId: sessionId! },
    skip: !sessionId,
    fetchPolicy: "cache-and-network",
  });

  const confirmedParticipants =
    data?.sessionEnrollments?.filter(
      (enrollment) => enrollment.status === "confirmed",
    ) ?? [];

  return {
    participants: confirmedParticipants,
    isLoading: loading,
    error: error ?? null,
    refetch,
    count: confirmedParticipants.length,
  };
};

/**
 * Hook to get pending participants
 *
 * Filters participants by pending status
 *
 * @param sessionId - Session ID
 * @returns Pending participants
 *
 * @example
 * ```tsx
 * const { participants, count } = usePendingParticipants(123);
 * ```
 */
export const usePendingParticipants = (
  sessionId: number | undefined,
): UseParticipantsReturn => {
  const { data, loading, error, refetch } = useGetSessionEnrollmentsQuery({
    variables: { sessionId: sessionId! },
    skip: !sessionId,
    fetchPolicy: "cache-and-network",
  });

  const pendingParticipants =
    data?.sessionEnrollments?.filter(
      (enrollment) => enrollment.status === "pending",
    ) ?? [];

  return {
    participants: pendingParticipants,
    isLoading: loading,
    error: error ?? null,
    refetch,
    count: pendingParticipants.length,
  };
};

/**
 * Legacy alias for useParticipants
 * @deprecated Use useParticipants instead
 */
export const useParticipantsCours = useParticipants;

/**
 * Legacy alias for useUserSessions
 * @deprecated Use useUserSessions instead
 */
export const useCoursUtilisateur = useUserSessions;
