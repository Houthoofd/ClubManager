/**
 * Alerts Hook
 *
 * NOTE: This is a temporary stub implementation to maintain compatibility.
 *
 * Migration plan:
 * 1. Define alerts/notifications schema in GraphQL
 * 2. Create alerts queries and mutations
 * 3. Generate hooks with graphql-codegen
 * 4. Replace these stub functions with real GraphQL hooks
 *
 * Current status: Waiting for backend alerts/notifications system implementation
 */

// ============================================================================
// Stub Hook - To be implemented with GraphQL
// ============================================================================

export const useDashboardAlertes = () => {
  return {
    dashboard: null,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
};

export const useAlertesActives = () => {
  return {
    alertes: [],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
};

export const useAlertesUtilisateur = (utilisateurId?: number) => {
  return {
    alertes: [],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
};

export const useStatistiquesAlertes = () => {
  return {
    stats: null,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
};

export const useDetecterAlertes = () => {
  return {
    detecter: async () => null,
    isLoading: false,
    error: null,
  };
};

export const useResoudreAlerte = () => {
  return {
    resoudre: async (input: any) => null,
    isLoading: false,
    error: null,
  };
};

export const useIgnorerAlerte = () => {
  return {
    ignorer: async (input: any) => null,
    isLoading: false,
    error: null,
  };
};

export const useCreerAlerte = () => {
  return {
    creer: async (input: any) => null,
    isLoading: false,
    error: null,
  };
};

/**
 * Combined alerts hook for convenience
 * @deprecated Use specific alert hooks instead
 */
export const useAlertes = () => {
  return {
    dashboard: useDashboardAlertes(),
    actives: useAlertesActives(),
    detecter: useDetecterAlertes(),
    resoudre: useResoudreAlerte(),
    ignorer: useIgnorerAlerte(),
    creer: useCreerAlerte(),
  };
};
