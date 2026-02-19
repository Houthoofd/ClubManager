import {
  useGetMeQuery,
  useUpdateUserMutation,
  useGetSubscriptionsQuery,
  useGetGradesQuery,
  useGetStatusesQuery,
  useGetGendersQuery,
  useGetUserSubscriptionQuery,
} from "@/lib/apollo/generated/graphql";
import type {
  GetMeQuery,
  UpdateUserMutation,
  UpdateUserInput,
  GetSubscriptionsQuery,
  GetGradesQuery,
  GetStatusesQuery,
  GetGendersQuery,
  GetUserSubscriptionQuery,
} from "@/lib/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type User = NonNullable<GetMeQuery["me"]>;
type Subscription = NonNullable<GetSubscriptionsQuery["subscriptions"]>[number];
type Grade = NonNullable<GetGradesQuery["grades"]>[number];
type Status = NonNullable<GetStatusesQuery["statuses"]>[number];
type Gender = NonNullable<GetGendersQuery["genders"]>[number];
type UserSubscription = NonNullable<
  GetUserSubscriptionQuery["userSubscription"]
>;

type UseCompteInfoReturn = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseUpdateCompteReturn = {
  updateProfile: (data: UpdateUserInput) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseSubscriptionsReturn = {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseGradesReturn = {
  grades: Grade[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseStatusesReturn = {
  statuses: Status[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseGendersReturn = {
  genders: Gender[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseUserSubscriptionReturn = {
  subscription: UserSubscription | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch current user's account information
 *
 * Returns the authenticated user's profile data
 *
 * @returns User account info with loading state
 *
 * @example
 * ```tsx
 * const { user, isLoading, error } = useCompteInfo();
 * if (user) {
 *   console.log(user.first_name, user.last_name);
 * }
 * ```
 */
export const useCompteInfo = (): UseCompteInfoReturn => {
  const { data, loading, error, refetch } = useGetMeQuery({
    fetchPolicy: "cache-and-network",
    skip: !localStorage.getItem("authToken"),
  });

  return {
    user: data?.me ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to update current user's account information
 *
 * Updates the authenticated user's profile
 *
 * @returns Update function with loading state
 *
 * @example
 * ```tsx
 * const { updateProfile, isLoading, success } = useUpdateCompte();
 *
 * await updateProfile({
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   phone: '+1234567890'
 * });
 * ```
 */
export const useUpdateCompte = (): UseUpdateCompteReturn => {
  const [updateUserMutation, { loading, error }] = useUpdateUserMutation();

  // Get current user ID
  const { data: meData } = useGetMeQuery({
    fetchPolicy: "cache-only",
  });

  const updateProfile = async (input: UpdateUserInput): Promise<void> => {
    if (!meData?.me?.id) {
      throw new Error("User not authenticated");
    }

    const result = await updateUserMutation({
      variables: {
        id: meData.me.id,
        input,
      },
      refetchQueries: ["GetMe"],
    });

    if (!result.data?.updateUser) {
      throw new Error("Profile update failed");
    }

    // Update localStorage userData
    const updatedUser = result.data.updateUser;
    localStorage.setItem("userData", JSON.stringify(updatedUser));
  };

  return {
    updateProfile,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to fetch all available subscriptions
 *
 * @returns List of subscription plans
 *
 * @example
 * ```tsx
 * const { subscriptions, isLoading } = useSubscriptions();
 * ```
 */
export const useSubscriptions = (): UseSubscriptionsReturn => {
  const { data, loading, error, refetch } = useGetSubscriptionsQuery({
    fetchPolicy: "cache-and-network",
  });

  return {
    subscriptions: data?.subscriptions ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch all available grades
 *
 * @returns List of martial arts grades/belts
 *
 * @example
 * ```tsx
 * const { grades, isLoading } = useGrades();
 * ```
 */
export const useGrades = (): UseGradesReturn => {
  const { data, loading, error, refetch } = useGetGradesQuery({
    fetchPolicy: "cache-and-network",
  });

  return {
    grades: data?.grades ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch all available statuses
 *
 * @returns List of user statuses
 *
 * @example
 * ```tsx
 * const { statuses, isLoading } = useStatuses();
 * ```
 */
export const useStatuses = (): UseStatusesReturn => {
  const { data, loading, error, refetch } = useGetStatusesQuery({
    fetchPolicy: "cache-and-network",
  });

  return {
    statuses: data?.statuses ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch all available genders
 *
 * @returns List of gender options
 *
 * @example
 * ```tsx
 * const { genders, isLoading } = useGenders();
 * ```
 */
export const useGenders = (): UseGendersReturn => {
  const { data, loading, error, refetch } = useGetGendersQuery({
    fetchPolicy: "cache-and-network",
  });

  return {
    genders: data?.genders ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch user's active subscription
 *
 * @param userId - User ID (optional, defaults to current user)
 * @returns User's active subscription
 *
 * @example
 * ```tsx
 * const { subscription, isLoading } = useUserSubscription(123);
 * ```
 */
export const useUserSubscription = (
  userId?: number,
): UseUserSubscriptionReturn => {
  // Get current user ID if not provided
  const { data: meData } = useGetMeQuery({
    fetchPolicy: "cache-only",
    skip: !!userId,
  });

  const effectiveUserId = userId ?? meData?.me?.id;

  const { data, loading, error, refetch } = useGetUserSubscriptionQuery({
    variables: { userId: effectiveUserId! },
    skip: !effectiveUserId,
    fetchPolicy: "cache-and-network",
  });

  return {
    subscription: data?.userSubscription ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Legacy alias for useSubscriptions
 * @deprecated Use useSubscriptions instead
 */
export const useAbonnements = useSubscriptions;

/**
 * Legacy alias for useGenders
 * @deprecated Use useGenders instead
 */
export const useGenres = useGenders;

/**
 * Alias for useStatuses
 */
export const useStatus = useStatuses;
