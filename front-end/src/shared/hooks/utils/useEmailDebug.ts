/**
 * Email Debug Hook
 *
 * NOTE: Email debugging functionality is currently disabled.
 * This is a placeholder until email testing features are implemented.
 *
 * Future implementation will require:
 * - GraphQL mutations for sending test emails
 * - Email configuration management endpoints
 * - Email template testing utilities
 *
 * Related backend work needed:
 * - Email service integration (SendGrid, AWS SES, etc.)
 * - Test email endpoints in GraphQL schema
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
