import React from 'react';
import { Modal, ModalVariant, Button } from '@patternfly/react-core';
import ModalWithHelp from './ModalWithHelp';
import { ArrowRightIcon } from '@/shared/icons';

interface ModalsUtilisateurProps {
  // Modal confirmation modifications
  showConfirmModal: boolean;
  modificationsResume: string[];
  userName: string;
  onAnnulerModifications: () => void;
  onConfirmerModifications: () => void;

  // Modal résultat
  showResultModal: boolean;
  modalSuccess: boolean;
  modalMessage: string;
  onCloseResultModal: () => void;
}

const ModalsUtilisateur: React.FC<ModalsUtilisateurProps> = ({
  showConfirmModal,
  modificationsResume,
  userName,
  onAnnulerModifications,
  onConfirmerModifications,
  showResultModal,
  modalSuccess,
  modalMessage,
  onCloseResultModal,
}) => {
  return (
    <>
      {/* Modal de confirmation */}
      <Modal
        variant={ModalVariant.large}
        title="Confirmer les modifications"
        isOpen={showConfirmModal}
        onClose={onAnnulerModifications}
        height="600px"
        maxHeight="90vh"
        actions={[
          <Button key="confirm" variant="primary" onClick={onConfirmerModifications}>
            Confirmer
          </Button>,
          <Button key="cancel" variant="link" onClick={onAnnulerModifications}>
            Annuler
          </Button>,
        ]}
      >
        <div style={{ maxHeight: '450px', overflowY: 'auto', padding: '0.5rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Vous êtes sur le point de modifier les informations de <strong>{userName}</strong>.
          </p>
          <p style={{ marginBottom: '1rem' }}>Récapitulatif des modifications :</p>
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
            }}
          >
            {modificationsResume.map((modification, index) => {
              // Parser la modification pour séparer les parties
              const parts = modification.split(': ');
              const field = parts[0];
              const values = parts[1];

              if (values && values.includes(' → ')) {
                const [oldValue, newValue] = values.split(' → ');
                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: index < modificationsResume.length - 1 ? '0.75rem' : '0',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <strong style={{ minWidth: 'fit-content' }}>{field}:</strong>
                    <span
                      style={{
                        backgroundColor: '#ffebee',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '3px',
                        border: '1px solid #ffcdd2',
                        fontSize: '0.9rem',
                      }}
                    >
                      {oldValue.replace(/"/g, '')}
                    </span>
                    <ArrowRightIcon style={{ color: '#666', fontSize: '0.8rem' }} />
                    <span
                      style={{
                        backgroundColor: '#e8f5e8',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '3px',
                        border: '1px solid #c8e6c9',
                        fontSize: '0.9rem',
                      }}
                    >
                      {newValue.replace(/"/g, '')}
                    </span>
                  </div>
                );
              } else {
                return (
                  <div key={index} style={{ marginBottom: index < modificationsResume.length - 1 ? '0.75rem' : '0' }}>
                    {modification}
                  </div>
                );
              }
            })}
          </div>
        </div>
      </Modal>

      {/* Modal de résultat */}
      <ModalWithHelp
        title={modalSuccess ? 'Succès' : 'Erreur'}
        isOpen={showResultModal}
        onClose={onCloseResultModal}
        variant={modalSuccess ? 'success' : 'error'}
        size="medium"
        cancelText="Fermer"
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          {modalSuccess ? (
            <div style={{ color: '#28a745', fontSize: '2rem' }}>✓</div>
          ) : (
            <div style={{ color: '#dc3545', fontSize: '2rem' }}>✗</div>
          )}
          <p style={{ 
            color: modalSuccess ? '#28a745' : '#dc3545', 
            fontSize: '1.1rem', 
            margin: 0,
            fontWeight: '500'
          }}>
            {modalMessage}
          </p>
        </div>
      </ModalWithHelp>
    </>
  );
};

export default ModalsUtilisateur;
