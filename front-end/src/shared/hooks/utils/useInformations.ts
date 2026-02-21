/**
 * Information/Reference Data Hooks
 *
 * These hooks provide access to reference data like grades, statuses,
 * genders, and subscriptions that are used throughout the application.
 */

import {
  useGetGradesQuery,
  useGetStatusesQuery,
  useGetGendersQuery,
  useGetSubscriptions,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Reference Data Hooks
// ============================================================================

/**
 * Get all grades
 */
export const useGrades = () => {
  return useGetGradesQuery({
    fetchPolicy: "cache-first", // Reference data changes infrequently
  });
};

/**
 * Get all statuses
 */
export const useStatuses = () => {
  return useGetStatusesQuery({
    fetchPolicy: "cache-first",
  });
};

/**
 * Get all genders
 */
export const useGenders = () => {
  return useGetGendersQuery({
    fetchPolicy: "cache-first",
  });
};

/**
 * Get all subscription plans
 */
export const useSubscriptions = () => {
  return useGetSubscriptions({
    fetchPolicy: "cache-first",
  });
};

/**
 * Composite hook to get all reference data at once
 * Useful for forms that need multiple reference data sets
 */
export const useAllReferenceData = () => {
  const gradesQuery = useGrades();
  const statusesQuery = useStatuses();
  const gendersQuery = useGenders();
  const subscriptionsQuery = useSubscriptions();

  return {
    grades: gradesQuery.data?.grades ?? [],
    statuses: statusesQuery.data?.statuses ?? [],
    genders: gendersQuery.data?.genders ?? [],
    subscriptions: subscriptionsQuery.data?.subscriptions ?? [],

    loading:
      gradesQuery.loading ||
      statusesQuery.loading ||
      gendersQuery.loading ||
      subscriptionsQuery.loading,

    error:
      gradesQuery.error ||
      statusesQuery.error ||
      gendersQuery.error ||
      subscriptionsQuery.error,

    refetchAll: () => {
      gradesQuery.refetch();
      statusesQuery.refetch();
      gendersQuery.refetch();
      subscriptionsQuery.refetch();
    },
  };
};

// ============================================================================
// Legacy Aliases (for backward compatibility)
// ============================================================================

export const useAbonnements = useSubscriptions;
export const useGenres = useGenders;
export const useStatus = useStatuses;
