import React from 'react';
import ModalWithHelp from './modalwithhelp'; // Utilisez la casse correcte

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
      {/* Modal de confirmation des modifications */}
      <ModalWithHelp
        title="Confirmer les modifications"
        isOpen={showConfirmModal}
        onClose={onAnnulerModifications}
        onConfirm={onConfirmerModifications}
        confirmText="Oui, appliquer les modifications"
        cancelText="Annuler"
      >
        <div>
          <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
            Les modifications suivantes vont être appliquées pour <strong>{userName}</strong> :
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            {modificationsResume.map((modification, index) => (
              <li key={index} style={{ marginBottom: '0.5rem', color: '#0066cc' }}>
                {modification}
              </li>
            ))}
          </ul>
          <p style={{ fontStyle: 'italic', color: '#666' }}>
            Êtes-vous sûr de vouloir appliquer ces modifications ?
          </p>
        </div>
      </ModalWithHelp>

      {/* Modal de résultat */}
      <ModalWithHelp
        title={modalSuccess ? "Succès" : "Erreur"}
        isOpen={showResultModal}
        onClose={onCloseResultModal}
      >
        <p style={{ color: modalSuccess ? 'green' : 'red', fontSize: '1rem', margin: '1rem 0' }}>
          {modalMessage}
        </p>
      </ModalWithHelp>
    </>
  );
};

export default ModalsUtilisateur;
