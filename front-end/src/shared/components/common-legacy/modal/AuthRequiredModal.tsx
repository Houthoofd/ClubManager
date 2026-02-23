import React, { useEffect } from 'react';
import { Button } from '@patternfly/react-core';
import { SignOutAltIcon, ExclamationTriangleIcon } from '@/shared/icons';
import { BaseModal } from './BaseModal';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onRedirect: () => void;
  autoRedirectDelay?: number; // Délai en secondes avant redirection automatique
  message?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onRedirect,
  autoRedirectDelay = 5,
  message = "Votre session a expiré ou vous n'êtes pas connecté."
}) => {
  const [countdown, setCountdown] = React.useState(autoRedirectDelay);

  useEffect(() => {
    if (isOpen && autoRedirectDelay > 0) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onRedirect();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, autoRedirectDelay, onRedirect]);

  // Réinitialiser le countdown quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCountdown(autoRedirectDelay);
    }
  }, [isOpen, autoRedirectDelay]);

  const handleRedirectNow = () => {
    onRedirect();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleRedirectNow}
      title="Authentification requise"
      variant="warning"
      hideCloseButton={false}
    >
      <div style={{ 
        textAlign: 'center', 
        padding: '1.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <ExclamationTriangleIcon 
          style={{ 
            fontSize: '3rem', 
            color: '#f0ad4e',
            marginBottom: '1rem'
          }} 
        />
        
        <div>
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '1rem',
            color: '#333'
          }}>
            {message}
          </p>
          
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#666',
            marginBottom: '1.5rem'
          }}>
            Vous allez être redirigé vers la page de connexion dans{' '}
            <strong style={{ color: '#f0ad4e' }}>{countdown}</strong> seconde{countdown > 1 ? 's' : ''}.
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem',
          justifyContent: 'center'
        }}>
          <Button
            variant="primary"
            onClick={handleRedirectNow}
            icon={<SignOutAltIcon />}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            Se connecter maintenant
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default AuthRequiredModal;
