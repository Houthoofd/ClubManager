import {
  useGetInstructorsQuery,
  useCreateInstructorMutation,
  useUpdateInstructorMutation,
  useDeleteInstructorMutation,
} from "@/core/api/apollo/generated/graphql";
import type {
  GetInstructorsQuery,
  CreateInstructorInput,
  UpdateInstructorInput,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type Instructor = NonNullable<GetInstructorsQuery["instructors"]>[number];

type UseInstructorsReturn = {
  instructors: Instructor[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseCreateInstructorReturn = {
  createInstructor: (input: CreateInstructorInput) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseUpdateInstructorReturn = {
  updateInstructor: (id: number, input: UpdateInstructorInput) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseDeleteInstructorReturn = {
  deleteInstructor: (id: number) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all instructors with optional pagination
 *
 * @param take - Number of instructors to fetch
 * @param skip - Number of instructors to skip
 * @returns Instructors list with loading state
 *
 * @example
 * ```tsx
 * const { instructors, isLoading } = useInstructors(10, 0);
 * ```
 */
export const useInstructors = (take?: number, skip?: number): UseInstructorsReturn => {
  const variables: { take?: number; skip?: number } = {};

  if (take !== undefined) variables.take = take;
  if (skip !== undefined) variables.skip = skip;

  const { data, loading, error, refetch } = useGetInstructorsQuery({
    variables,
    fetchPolicy: "cache-and-network",
  });

  return {
    instructors: data?.instructors ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to create a new instructor
 *
 * @returns Create function with loading state
 *
 * @example
 * ```tsx
 * const { createInstructor, isLoading, success } = useCreateInstructor();
 *
 * await createInstructor({
 *   user_id: 123,
 *   specialization: 'Karate',
 *   bio: 'Expert instructor with 20 years experience',
 *   certifications: '3rd Dan Black Belt',
 *   active: true
 * });
 * ```
 */
export const useCreateInstructor = (): UseCreateInstructorReturn => {
  const [createInstructorMutation, { loading, error }] = useCreateInstructorMutation();

  const createInstructor = async (input: CreateInstructorInput): Promise<void> => {
    console.log("📝 [useCreateInstructor] Creating instructor:", input);

    const result = await createInstructorMutation({
      variables: { input },
      refetchQueries: ["GetInstructors", "GetSessions"],
    });

    if (!result.data?.createInstructor) {
      throw new Error("Instructor creation failed");
    }

    console.log("✅ [useCreateInstructor] Instructor created:", result.data.createInstructor.id);
  };

  return {
    createInstructor,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to update an existing instructor
 *
 * @returns Update function with loading state
 *
 * @example
 * ```tsx
 * const { updateInstructor, isLoading } = useUpdateInstructor();
 *
 * await updateInstructor(5, {
 *   specialization: 'Karate & Judo',
 *   bio: 'Updated bio text'
 * });
 * ```
 */
export const useUpdateInstructor = (): UseUpdateInstructorReturn => {
  const [updateInstructorMutation, { loading, error }] = useUpdateInstructorMutation();

  const updateInstructor = async (id: number, input: UpdateInstructorInput): Promise<void> => {
    console.log("📝 [useUpdateInstructor] Updating instructor:", id, input);

    const result = await updateInstructorMutation({
      variables: { id, input },
      refetchQueries: ["GetInstructors", "GetSessions"],
    });

    if (!result.data?.updateInstructor) {
      throw new Error("Instructor update failed");
    }

    console.log("✅ [useUpdateInstructor] Instructor updated:", result.data.updateInstructor.id);
  };

  return {
    updateInstructor,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to delete an instructor
 *
 * @returns Delete function with loading state
 *
 * @example
 * ```tsx
 * const { deleteInstructor, isLoading } = useDeleteInstructor();
 *
 * await deleteInstructor(5);
 * ```
 */
export const useDeleteInstructor = (): UseDeleteInstructorReturn => {
  const [deleteInstructorMutation, { loading, error }] = useDeleteInstructorMutation();

  const deleteInstructor = async (id: number): Promise<void> => {
    console.log("🗑️ [useDeleteInstructor] Deleting instructor:", id);

    const result = await deleteInstructorMutation({
      variables: { id },
      refetchQueries: ["GetInstructors", "GetSessions"],
    });

    if (!result.data?.deleteInstructor?.success) {
      throw new Error(result.data?.deleteInstructor?.message || "Instructor deletion failed");
    }

    console.log("✅ [useDeleteInstructor] Instructor deleted:", id);
  };

  return {
    deleteInstructor,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to get all instructors (alias without pagination)
 *
 * @returns All instructors
 *
 * @example
 * ```tsx
 * const { instructors, isLoading } = useAllInstructors();
 * ```
 */
export const useAllInstructors = (): UseInstructorsReturn => {
  return useInstructors();
};

/**
 * Legacy alias for useInstructors
 * @deprecated Use useInstructors instead
 */
export const useProfesseurs = useInstructors;

/**
 * Hook to delete a recurring course
 *
 * WORKAROUND: Uses standard session deletion until recurring course
 * management is added to the schema
 *
 * @returns Delete function with loading state
 *
 * @example
 * ```tsx
 * const { supprimerCoursRecurrent, isLoading } = useSupprimerCoursRecurrent();
 *
 * await supprimerCoursRecurrent(123);
 * ```
 */
export const useSupprimerCoursRecurrent = () => {
  console.warn(
    "⚠️ [useSupprimerCoursRecurrent] Workaround - uses standard session deletion. " +
      "Recurring course schema not yet implemented.",
  );

  const supprimerCoursRecurrent = async (coursId: number): Promise<void> => {
    console.log("🗑️ [useSupprimerCoursRecurrent] Deleting recurring course:", coursId);

    // WORKAROUND: This should delete a recurring course template
    // For now, suggest using DeleteSession mutation instead
    console.warn(
      "Use DeleteSession mutation for individual sessions. " +
        "Recurring course deletion requires backend implementation.",
    );

    throw new Error(
      "Recurring course deletion not implemented. Use session deletion for individual sessions.",
    );
  };

  return {
    supprimerCoursRecurrent,
    isLoading: false,
    error: null,
    success: false,
  };
};

/**
 * Hook to remove instructors from a course
 *
 * WORKAROUND: Uses session update to change instructor
 * Multi-instructor support requires schema changes
 *
 * @returns Remove instructors function with loading state
 *
 * @example
 * ```tsx
 * const { retirerProfesseurs, isLoading } = useRetirerProfesseursDuCours();
 *
 * await retirerProfesseurs(456, [1, 2, 3]);
 * ```
 */
export const useRetirerProfesseursDuCours = () => {
  console.warn(
    "⚠️ [useRetirerProfesseursDuCours] Workaround - schema only supports single instructor. " +
      "Use UpdateSession to change instructor_id instead.",
  );

  const retirerProfesseurs = async (coursId: number, professeurIds: number[]): Promise<void> => {
    console.log("🗑️ [useRetirerProfesseursDuCours] Removing instructors from course:", {
      coursId,
      professeurIds,
    });

    // WORKAROUND: Current schema only supports one instructor per session
    // Sessions table has instructor_id (singular), not a many-to-many relationship
    // To remove an instructor, you would need to:
    // 1. Use UpdateSession mutation to set instructor_id to null or another instructor
    // 2. Backend needs to support multiple instructors per session first

    console.warn(
      "Current schema only supports single instructor_id per session. " +
        "Use UpdateSession mutation to change the instructor instead.",
    );

    throw new Error(
      "Multi-instructor removal not supported. Use UpdateSession to change instructor_id.",
    );
  };

  return {
    retirerProfesseurs,
    isLoading: false,
    error: null,
    success: false,
  };
};

/**
 * Legacy alias for useCreateInstructor
 * @deprecated Use useCreateInstructor instead
 */
export const useAjouterProfesseur = useCreateInstructor;

/**
 * Legacy alias for useUpdateInstructor
 * @deprecated Use useUpdateInstructor instead
 */
export const useModifierProfesseur = useUpdateInstructor;

/**
 * Legacy alias for useDeleteInstructor
 * @deprecated Use useDeleteInstructor instead
 */
export const useSupprimerProfesseur = useDeleteInstructor;
