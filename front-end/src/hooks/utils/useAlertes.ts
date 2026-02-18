/**
 * Alerts Hook
 *
 * TODO: Migrate to GraphQL once alerts schema is defined
 * This is a temporary stub to maintain compatibility
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
