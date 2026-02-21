import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  useGetMeQuery,
  useUpdateUserMutation,
  useGetSubscriptionsQuery,
  useGetGradesQuery,
  useGetStatusesQuery,
  useGetGendersQuery,
  useGetUserSubscription,
  useGetSubscriptions,
} from "@/core/api/apollo/generated/graphql";
import type { UpdateUserInput } from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type UseCompteDataReturn = {
  userData: any | null;
  utilisateurId: number | null;
  compteInfo: any;
  updateCompte: (data: UpdateUserInput) => Promise<void>;
  subscriptions: any[];
  grades: any[];
  statuses: any[];
  genders: any[];
  userSubscription: any;
  isDataReady: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to fetch and manage user account data
 *
 * Combines user profile, subscriptions, grades, statuses, and related data
 * Provides update functionality for user profile
 *
 * @returns Complete user account data with update function
 *
 * @example
 * ```tsx
 * const {
 *   userData,
 *   compteInfo,
 *   subscriptions,
 *   updateCompte,
 *   isDataReady
 * } = useCompteData();
 *
 * await updateCompte({
 *   first_name: 'John',
 *   last_name: 'Doe'
 * });
 * ```
 */
export const useCompteData = (): UseCompteDataReturn => {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<any | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);

  // Get userData from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
        console.log("👤 [useCompteData] User data loaded from localStorage:", {
          id: parsedData.id,
          email: parsedData.email,
        });
      } catch (error) {
        console.error("❌ [useCompteData] Error parsing localStorage:", error);
      }
    }
  }, []);

  const utilisateurId = userData?.id || (id ? parseInt(id, 10) : null);

  // Fetch current user data
  const {
    data: meData,
    loading: loadingMe,
    error: errorMe,
    refetch: refetchMe,
  } = useGetMeQuery({
    fetchPolicy: "cache-and-network",
    skip: !localStorage.getItem("authToken"),
  });

  // Fetch user's subscription
  const {
    data: subscriptionData,
    loading: loadingSubscription,
    refetch: refetchSubscription,
  } = useGetUserSubscription({
    variables: { userId: utilisateurId! },
    skip: !utilisateurId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch all subscriptions
  const { data: subscriptionsData } = useGetSubscriptions({
    fetchPolicy: "cache-and-network",
  });

  // Fetch all grades
  const { data: gradesData } = useGetGradesQuery({
    fetchPolicy: "cache-and-network",
  });

  // Fetch all statuses
  const { data: statusesData } = useGetStatusesQuery({
    fetchPolicy: "cache-and-network",
  });

  // Fetch all genders
  const { data: gendersData } = useGetGendersQuery({
    fetchPolicy: "cache-and-network",
  });

  // Update user mutation
  const [updateUserMutation, { loading: loadingUpdate }] = useUpdateUserMutation();

  // Update compte function
  const updateCompte = async (input: UpdateUserInput): Promise<void> => {
    if (!meData?.me?.id) {
      throw new Error("User not authenticated");
    }

    console.log("📝 [useCompteData] Updating user profile:", input);

    const result = await updateUserMutation({
      variables: {
        id: meData.me.id,
        input,
      },
      refetchQueries: ["GetMe", "GetUserSubscription"],
    });

    if (!result.data?.updateUser) {
      throw new Error("Profile update failed");
    }

    // Update localStorage
    const updatedUser = result.data.updateUser;
    localStorage.setItem("userData", JSON.stringify(updatedUser));
    setUserData(updatedUser);

    console.log("✅ [useCompteData] Profile updated successfully");

    // Refetch queries
    await refetchMe();
    await refetchSubscription();
  };

  // Check if data is ready
  useEffect(() => {
    if (meData?.me && userData && !loadingMe) {
      setIsDataReady(true);
    }
  }, [meData, userData, loadingMe]);

  // Debug logging
  useEffect(() => {
    if (utilisateurId) {
      console.log("🔍 [useCompteData] User ID:", utilisateurId);
      console.log("🔑 [useCompteData] Auth token exists:", !!localStorage.getItem("authToken"));
    }

    if (errorMe) {
      console.error("❌ [useCompteData] Error loading user data:", errorMe);
    }
  }, [utilisateurId, errorMe]);

  const isLoading = loadingMe || loadingSubscription || loadingUpdate;

  const refetch = async () => {
    await refetchMe();
    await refetchSubscription();
  };

  return {
    userData,
    utilisateurId,
    compteInfo: meData?.me ?? null,
    updateCompte,
    subscriptions: subscriptionsData?.subscriptions ?? [],
    grades: gradesData?.grades ?? [],
    statuses: statusesData?.statuses ?? [],
    genders: gendersData?.genders ?? [],
    userSubscription: subscriptionData?.userSubscription ?? null,
    isDataReady,
    isLoading,
    error: errorMe ?? null,
    refetch,
  };
};

/**
 * Legacy alias
 * @deprecated Use useCompteData instead
 */
export const useCompteDataLegacy = useCompteData;
