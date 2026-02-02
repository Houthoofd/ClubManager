import React from 'react';
import { Button } from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { BaseModal } from './BaseModal';

interface PresenceConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuccess: boolean;
  message: string;
  participantName?: string;
  action?: 'valider' | 'annuler';
}

export const PresenceConfirmationModal: React.FC<PresenceConfirmationModalProps> = ({
  isOpen,
  onClose,
  isSuccess,
  message,
  participantName,
  action
}) => {
  const getTitle = () => {
    if (isSuccess) {
      return action === 'valider' ? 'Présence validée' : 'Présence annulée';
    }
    return 'Erreur de mise à jour';
  };

  const getIcon = () => {
    if (isSuccess) {
      return (
        <CheckCircleIcon 
          style={{ 
            fontSize: '3rem', 
            color: '#28a745',
            marginBottom: '1rem'
          }} 
        />
      );
    }
    return (
      <ExclamationCircleIcon 
        style={{ 
          fontSize: '3rem', 
          color: '#dc3545',
          marginBottom: '1rem'
        }} 
      />
    );
  };

  const getVariant = () => {
    return isSuccess ? 'success' : 'danger';
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      variant={getVariant()}
      hideCloseButton={false}
      size="small" // Rendre la modal plus petite
    >
      <div style={{ 
        textAlign: 'center', 
        padding: '1rem 0', // Réduire le padding
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem' // Réduire l'espacement
      }}>
        {/* Icône plus petite */}
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          {isSuccess ? (
            <CheckCircleIcon style={{ color: '#28a745' }} />
          ) : (
            <ExclamationCircleIcon style={{ color: '#dc3545' }} />
          )}
        </div>
        
        {participantName && (
          <div style={{ 
            background: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            padding: '0.5rem 0.75rem', // Padding plus compact
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '1rem', // Taille de police réduite
            marginBottom: '0.25rem'
          }}>
            {participantName}
          </div>
        )}
        
        <p style={{ 
          fontSize: '0.9rem', // Taille de police réduite
          color: isSuccess ? '#28a745' : '#dc3545',
          margin: '0',
          fontWeight: '500'
        }}>
          {message}
        </p>

        <div style={{ 
          marginTop: '0.75rem', // Marge réduite
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Button
            variant="primary"
            onClick={onClose}
            size="sm" // Bouton plus petit
            style={{
              background: isSuccess 
                ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              border: 'none',
              minWidth: '100px' // Largeur réduite
            }}
          >
            Fermer
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PresenceConfirmationModal;
