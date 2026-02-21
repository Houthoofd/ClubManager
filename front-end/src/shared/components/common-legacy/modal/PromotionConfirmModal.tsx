import React from 'react';
import { Button } from '@patternfly/react-core';
import BaseModal from './BaseModal';

interface PromotionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  utilisateurs: any[];
  selectedUsers: any[];
  verifMessage?: string | null;
  verifChecked: boolean;
  promoteResult?: { success: boolean; message: string } | null;
  isLoading?: boolean;
}

const PromotionConfirmModal: React.FC<PromotionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  utilisateurs,
  selectedUsers,
  verifMessage,
  verifChecked,
  promoteResult,
  isLoading = false
}) => {
  const selectedUtilisateurs = utilisateurs.filter(u => 
    selectedUsers.includes(String(u.id))
  );

  const actions = [
    <Button
      key="confirm"
      variant={promoteResult?.success === false ? 'danger' : 'primary'}
      onClick={onConfirm}
      isDisabled={promoteResult?.success === true || isLoading}
      isLoading={isLoading}
    >
      Oui, promouvoir
    </Button>,
    <Button
      key="cancel"
      variant="link"
      onClick={onClose}
      isDisabled={isLoading}
    >
      Annuler
    </Button>
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmer la promotion"
      variant={promoteResult?.success === false ? 'danger' : 'primary'}
      actions={actions}
      width="medium"
    >
      <div style={{ padding: '1rem 0' }}>
        {/* Message de vérification avant promotion */}
        {verifChecked && verifMessage && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#fef7f0',
              border: '1px solid #f0ad4e',
              borderRadius: '4px',
              color: '#8a6d3b'
            }}
          >
            <strong>⚠️ Attention :</strong> {verifMessage}
          </div>
        )}
        
        {promoteResult ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '4px',
              backgroundColor: promoteResult.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${promoteResult.success ? '#c3e6cb' : '#f5c6cb'}`,
              color: promoteResult.success ? '#155724' : '#721c24'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {promoteResult.success ? '✅ Succès' : '❌ Erreur'}
            </div>
            <div>{promoteResult.message}</div>
            {promoteResult.success && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '0.9em', 
                fontStyle: 'italic',
                opacity: 0.8
              }}>
                Cette fenêtre se fermera automatiquement dans quelques secondes...
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 500, color: '#333', marginBottom: '1rem' }}>
                Êtes-vous sûr de vouloir promouvoir {selectedUtilisateurs.length === 1 ? 'cet utilisateur' : 'ces utilisateurs'} au rôle de professeur{selectedUtilisateurs.length > 1 ? 's' : ''} ?
              </p>
              
              <div style={{ 
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#495057'
                }}>
                  Utilisateur{selectedUtilisateurs.length > 1 ? 's' : ''} sélectionné{selectedUtilisateurs.length > 1 ? 's' : ''} :
                </div>
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: '1.2rem',
                  listStyle: 'none'
                }}>
                  {selectedUtilisateurs.map(u => (
                    <li key={u.id} style={{ 
                      marginBottom: '6px',
                      padding: '4px 8px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '4px',
                      color: '#1565c0',
                      fontWeight: 500
                    }}>
                      👤 {u.first_name} {u.last_name} ({u.email})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div style={{ 
              fontSize: '0.9em',
              color: '#6c757d',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              borderLeft: '4px solid #17a2b8'
            }}>
              <strong>ℹ️ Information :</strong> Cette action permettra à ces utilisateurs d'enseigner des cours et d'accéder aux fonctionnalités de professeur.
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};

export default PromotionConfirmModal;
