import {
  useGetUsersQuery,
  useGetUserQuery,
} from "@/lib/apollo/generated/graphql";
import type {
  GetUsersQuery,
  GetUserQuery,
  GetUsersQueryVariables,
} from "@/lib/apollo/generated/graphql";

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
