import React from 'react';
import { Alert, AlertVariant, Button } from '@patternfly/react-core';

interface EmailDebugPanelProps {
  emailConfig: any;
  testEmail: {
    mutate: (email: string) => void;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    data?: any;
    error?: any;
  };
}

export const EmailDebugPanel: React.FC<EmailDebugPanelProps> = ({ emailConfig, testEmail }) => {
  // Ne s'affiche qu'en développement
  if (process.env.NODE_ENV !== 'development' || !emailConfig) {
    return null;
  }

  const handleTestEmail = () => {
    const email = prompt('Email pour test:');
    if (email) {
      testEmail.mutate(email);
    }
  };

  return (
    <Alert
      variant={emailConfig.success ? AlertVariant.success : AlertVariant.warning}
      title={`Configuration Email: ${emailConfig.success ? 'OK' : 'Problème détecté'}`}
      isInline
      style={{ marginBottom: '1rem' }}
    >
      {emailConfig.success ? (
        <div>
          ✅ SendGrid configuré correctement
          <div style={{ marginTop: '10px' }}>
            <Button
              variant="link"
              size="sm"
              onClick={handleTestEmail}
              isDisabled={testEmail.isPending}
            >
              {testEmail.isPending ? 'Test en cours...' : 'Tester envoi email'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          ❌ Problèmes de configuration:
          <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
            {emailConfig.details?.recommendations?.map((rec: string, idx: number) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
      
      {testEmail.isSuccess && (
        <div style={{ marginTop: '10px', color: '#27ae60' }}>
          ✅ Email de test envoyé ! Message ID: {testEmail.data?.messageId}
        </div>
      )}
      
      {testEmail.isError && (
        <div style={{ marginTop: '10px', color: '#e74c3c' }}>
          ❌ Échec test email: {testEmail.error?.message}
        </div>
      )}
    </Alert>
  );
};
