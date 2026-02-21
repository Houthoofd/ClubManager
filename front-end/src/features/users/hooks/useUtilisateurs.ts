import {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useCheckEmailLazyQuery,
} from "@/core/api/apollo/generated/graphql";
import type {
  GetUsersQuery,
  GetUserQuery,
  GetUsersQueryVariables,
  CreateUserInput,
  UpdateUserInput,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type User = NonNullable<GetUsersQuery["users"]>[number];
type UserDetail = NonNullable<GetUserQuery["user"]>;

type UseUsersReturn = {
  users: User[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseUserByIdReturn = {
  user: UserDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all users with optional pagination
 *
 * Uses GraphQL auto-generated hook from schema
 *
 * @param take - Number of users to fetch
 * @param skip - Number of users to skip (for pagination)
 * @returns Users list with loading state
 *
 * @example
 * ```tsx
 * const { users, isLoading, error } = useUsers(10, 0);
 * ```
 */
export const useUsers = (take?: number, skip?: number): UseUsersReturn => {
  const variables: GetUsersQueryVariables = {};

  if (take !== undefined) variables.take = take;
  if (skip !== undefined) variables.skip = skip;

  const { data, loading, error, refetch } = useGetUsersQuery({
    variables,
    fetchPolicy: "cache-and-network",
  });

  return {
    users: data?.users ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch a single user by ID
 *
 * @param id - User ID
 * @returns User details with loading state
 *
 * @example
 * ```tsx
 * const { user, isLoading } = useUserById(123);
 * ```
 */
export const useUserById = (id: number | undefined): UseUserByIdReturn => {
  const { data, loading, error, refetch } = useGetUserQuery({
    variables: { id: id! },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  return {
    user: data?.user ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to get all users (alias for useUsers without pagination)
 *
 * @returns All users
 */
export const useAllUsers = (): UseUsersReturn => {
  return useUsers();
};

/**
 * Legacy alias for useUsers
 * @deprecated Use useUsers instead
 */
export const useUtilisateurs = useUsers;

/**
 * Legacy alias for useUserById
 * @deprecated Use useUserById instead
 */
export const useUtilisateurById = useUserById;

/**
 * Hook to update a user
 */
export const useUpdateUtilisateur = () => {
  const [updateUserMutation, { loading, error }] = useUpdateUserMutation();

  const updateUtilisateur = async (id: number, input: UpdateUserInput) => {
    console.log("📝 [useUpdateUtilisateur] Updating user:", { id, input });

    const result = await updateUserMutation({
      variables: { id, input },
      refetchQueries: ["GetUsers", "GetUser"],
    });

    if (!result.data?.updateUser) {
      throw new Error("User update failed");
    }

    console.log("✅ [useUpdateUtilisateur] User updated:", result.data.updateUser.id);
  };

  return {
    updateUtilisateur,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to delete a user
 */
export const useDeleteUtilisateur = () => {
  const [deleteUserMutation, { loading, error }] = useDeleteUserMutation();

  const deleteUtilisateur = async (id: number) => {
    console.log("🗑️ [useDeleteUtilisateur] Deleting user:", id);

    const result = await deleteUserMutation({
      variables: { id },
      refetchQueries: ["GetUsers"],
    });

    if (!result.data?.deleteUser?.success) {
      throw new Error(result.data?.deleteUser?.message || "User deletion failed");
    }

    console.log("✅ [useDeleteUtilisateur] User deleted:", id);
  };

  return {
    deleteUtilisateur,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to add/create a user
 */
export const useAjouterUtilisateur = () => {
  const [createUserMutation, { loading, error }] = useCreateUserMutation();

  const ajouterUtilisateur = async (input: CreateUserInput) => {
    console.log("📝 [useAjouterUtilisateur] Adding user:", input);

    const result = await createUserMutation({
      variables: { input },
      refetchQueries: ["GetUsers"],
    });

    if (!result.data?.createUser) {
      throw new Error("User creation failed");
    }

    console.log("✅ [useAjouterUtilisateur] User created:", result.data.createUser.id);
    return result.data.createUser;
  };

  return {
    ajouterUtilisateur,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to check if email exists
 */
export const useCheckEmailExists = () => {
  const [checkEmail] = useCheckEmailLazyQuery({
    fetchPolicy: "network-only",
  });

  return async (email: string): Promise<boolean> => {
    try {
      console.log("🔍 [checkEmailExists] Checking email:", email);
      const result = await checkEmail({
        variables: { email },
      });
      const exists = result.data?.checkEmail?.exists ?? false;
      console.log("✅ [checkEmailExists] Result:", exists);
      return exists;
    } catch (error) {
      console.error("❌ [checkEmailExists] Error:", error);
      return false;
    }
  };
};

/**
 * Function to check if email exists (legacy function wrapper)
 * @deprecated Use useCheckEmailExists hook instead
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  console.warn(
    "⚠️ [checkEmailExists] This function is deprecated. Use useCheckEmailExists hook instead.",
  );
  // Fallback implementation
  try {
    const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
    if (response.ok) {
      const data = await response.json();
      return data.exists ?? false;
    }
  } catch (error) {
    console.error("Error checking email:", error);
  }
  return false;
};
