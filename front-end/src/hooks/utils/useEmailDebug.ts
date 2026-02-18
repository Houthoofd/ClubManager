/**
 * Email Debug Hook
 *
 * TODO: Re-enable after migrating useTestEmailConfig and useTestEmail hooks
 * These hooks are referenced but not yet migrated to GraphQL
 */

// import { useTestEmailConfig, useTestEmail } from './useInscriptions';

export const useEmailDebug = () => {
  // const { data: emailConfig } = useTestEmailConfig();
  // const testEmail = useTestEmail();

  // Retourner les données pour le composant debug
  return {
    emailConfig: null,
    testEmail: null,
    // Helper pour vérifier si le debug doit être affiché
    shouldShowDebug: false, // process.env.NODE_ENV === 'development' && emailConfig
  };
};
