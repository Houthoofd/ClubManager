import { useTestEmailConfig, useTestEmail } from './useInscriptions';

export const useEmailDebug = () => {
  const { data: emailConfig } = useTestEmailConfig();
  const testEmail = useTestEmail();

  // Retourner les données pour le composant debug
  return {
    emailConfig,
    testEmail,
    // Helper pour vérifier si le debug doit être affiché
    shouldShowDebug: process.env.NODE_ENV === 'development' && emailConfig
  };
};
