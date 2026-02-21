import {
  useGetSessionsQuery,
  useGetSessionQuery,
  useGetSessionTypesQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
} from "@/core/api/apollo/generated/graphql";
import type {
  GetSessionsQuery,
  GetSessionQuery,
  GetSessionTypesQuery,
  CreateSessionInput,
  UpdateSessionInput,
} from "@/core/api/apollo/generated/graphql";
import { useUserEnrollments, useAnnulerPresence, useValiderPresence } from "./useInscriptions";
import { useInstructors } from "./useProfesseurs";

// ============================================================================
// Types
// ============================================================================

type Session = NonNullable<GetSessionsQuery["sessions"]>[number];
type SessionDetail = NonNullable<GetSessionQuery["session"]>;
type SessionType = NonNullable<GetSessionTypesQuery["sessionTypes"]>[number];

type UseSessionsReturn = {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseSessionByIdReturn = {
  session: SessionDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseSessionTypesReturn = {
  sessionTypes: SessionType[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseCreateSessionReturn = {
  createSession: (input: CreateSessionInput) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseUpdateSessionReturn = {
  updateSession: (id: number, input: UpdateSessionInput) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseDeleteSessionReturn = {
  deleteSession: (id: number) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all sessions with optional pagination
 *
 * @param take - Number of sessions to fetch
 * @param skip - Number of sessions to skip
 * @returns Sessions list with loading state
 *
 * @example
 * ```tsx
 * const { sessions, isLoading } = useSessions(10, 0);
 * ```
 */
export const useSessions = (take?: number, skip?: number): UseSessionsReturn => {
  const variables: { take?: number; skip?: number } = {};

  if (take !== undefined) variables.take = take;
  if (skip !== undefined) variables.skip = skip;

  const { data, loading, error, refetch } = useGetSessionsQuery({
    variables,
    fetchPolicy: "cache-and-network",
  });

  return {
    sessions: data?.sessions ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch a single session by ID
 *
 * @param id - Session ID
 * @returns Session details with loading state
 *
 * @example
 * ```tsx
 * const { session, isLoading } = useSessionById(123);
 * ```
 */
export const useSessionById = (id: number | undefined): UseSessionByIdReturn => {
  const { data, loading, error, refetch } = useGetSessionQuery({
    variables: { id: id! },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  return {
    session: data?.session ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch all session types
 *
 * @returns Session types list with loading state
 *
 * @example
 * ```tsx
 * const { sessionTypes, isLoading } = useSessionTypes();
 * ```
 */
export const useSessionTypes = (): UseSessionTypesReturn => {
  const { data, loading, error, refetch } = useGetSessionTypesQuery({
    fetchPolicy: "cache-and-network",
  });

  return {
    sessionTypes: data?.sessionTypes ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to create a new session
 *
 * @returns Create function with loading state
 *
 * @example
 * ```tsx
 * const { createSession, isLoading, success } = useCreateSession();
 *
 * await createSession({
 *   session_type_id: 1,
 *   instructor_id: 5,
 *   date: '2025-02-20',
 *   start_time: '18:00',
 *   end_time: '19:30',
 *   location: 'Dojo Principal',
 *   max_participants: 20
 * });
 * ```
 */
export const useCreateSession = (): UseCreateSessionReturn => {
  const [createSessionMutation, { loading, error }] = useCreateSessionMutation();

  const createSession = async (input: CreateSessionInput): Promise<void> => {
    console.log("📝 [useCreateSession] Creating session:", input);

    const result = await createSessionMutation({
      variables: { input },
      refetchQueries: ["GetSessions", "GetSessionTypes"],
    });

    if (!result.data?.createSession) {
      throw new Error("Session creation failed");
    }

    console.log("✅ [useCreateSession] Session created:", result.data.createSession.id);
  };

  return {
    createSession,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to update an existing session
 *
 * @returns Update function with loading state
 *
 * @example
 * ```tsx
 * const { updateSession, isLoading } = useUpdateSession();
 *
 * await updateSession(123, {
 *   location: 'Nouveau Dojo',
 *   max_participants: 25
 * });
 * ```
 */
export const useUpdateSession = (): UseUpdateSessionReturn => {
  const [updateSessionMutation, { loading, error }] = useUpdateSessionMutation();

  const updateSession = async (id: number, input: UpdateSessionInput): Promise<void> => {
    console.log("📝 [useUpdateSession] Updating session:", id, input);

    const result = await updateSessionMutation({
      variables: { id, input },
      refetchQueries: ["GetSessions", "GetSession"],
    });

    if (!result.data?.updateSession) {
      throw new Error("Session update failed");
    }

    console.log("✅ [useUpdateSession] Session updated:", result.data.updateSession.id);
  };

  return {
    updateSession,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to delete a session
 *
 * @returns Delete function with loading state
 *
 * @example
 * ```tsx
 * const { deleteSession, isLoading } = useDeleteSession();
 *
 * await deleteSession(123);
 * ```
 */
export const useDeleteSession = (): UseDeleteSessionReturn => {
  const [deleteSessionMutation, { loading, error }] = useDeleteSessionMutation();

  const deleteSession = async (id: number): Promise<void> => {
    console.log("🗑️ [useDeleteSession] Deleting session:", id);

    const result = await deleteSessionMutation({
      variables: { id },
      refetchQueries: ["GetSessions"],
    });

    if (!result.data?.deleteSession?.success) {
      throw new Error(result.data?.deleteSession?.message || "Session deletion failed");
    }

    console.log("✅ [useDeleteSession] Session deleted:", id);
  };

  return {
    deleteSession,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Legacy alias for useSessions
 * @deprecated Use useSessions instead
 */
export const useCours = useSessions;

/**
 * Legacy alias for useSessions (planning view)
 * @deprecated Use useSessions instead
 */
export const useCoursPlanning = useSessions;

/**
 * Legacy alias for useSessions (planning days view)
 * @deprecated Use useSessions instead
 */
export const useJoursDeCours = useSessions;

/**
 * Legacy alias for useCreateSession
 * @deprecated Use useCreateSession instead
 */
export const useAjouterCours = useCreateSession;

/**
 * Legacy alias for useUpdateSession
 * @deprecated Use useUpdateSession instead
 */
export const useModifierCours = useUpdateSession;

/**
 * Legacy alias for useDeleteSession
 * @deprecated Use useDeleteSession instead
 */
export const useSupprimerCours = useDeleteSession;

/**
 * Legacy alias for useUserEnrollments (enrolled courses for a user)
 * @deprecated Use useUserEnrollments from useInscriptions instead
 */
export const useCoursInscritsUtilisateur = useUserEnrollments;

/**
 * Legacy alias for useInstructors
 * @deprecated Use useInstructors from useProfesseurs instead
 */
export const useProfesseurs = useInstructors;

// Re-export presence validation hooks from useInscriptions
export { useAnnulerPresence, useValiderPresence };
