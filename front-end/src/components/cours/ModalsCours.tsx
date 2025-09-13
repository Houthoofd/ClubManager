import React from 'react';
import ModalConfirmation from '../common/modal/ModalConfirmation';

interface ModalsCoursProps {
  // Modal dissociation
  isModalOpen: boolean;
  successMessage: string | null;
  professeurADissocier: { cours: any; prof: any } | null;
  onAnnulerDissociation: () => void;
  onConfirmerDissociation: () => void;

  // Modal suppression
  showSupprimerModal: boolean;
  coursASupprimer: any | null;
  onAnnulerSuppression: () => void;
  onConfirmerSuppression: () => void;

  // Modal ajout/modification
  showAjoutModal: boolean;
  ajoutSuccess: boolean;
  ajoutMessage: string | null;
  onFermerAjoutModal: () => void;

  // Modal confirmation modifications
  showConfirmModificationModal: boolean;
  modificationsResume: string[];
  originalCours: any | null;
  onAnnulerConfirmationModification: () => void;
  onConfirmerModification: () => void;
}

const ModalsCours: React.FC<ModalsCoursProps> = ({
  isModalOpen, successMessage, professeurADissocier, onAnnulerDissociation, onConfirmerDissociation,
  showSupprimerModal, coursASupprimer, onAnnulerSuppression, onConfirmerSuppression,
  showAjoutModal, ajoutSuccess, ajoutMessage, onFermerAjoutModal,
  showConfirmModificationModal, modificationsResume, originalCours, onAnnulerConfirmationModification, onConfirmerModification
}) => {
  return (
    <>
      {/* Modal dissociation professeur */}
      <ModalConfirmation
        title={successMessage ? "Dissociation effectuée" : "Confirmer la dissociation"}
        isOpen={isModalOpen}
        onClose={onAnnulerDissociation}
        onConfirm={successMessage ? undefined : onConfirmerDissociation}
        confirmText="Oui, dissocier"
        variant="danger"
      >
        {successMessage ? (
          <p style={{ color: 'green' }}>{successMessage}</p>
        ) : (
          professeurADissocier && (
            <p>
              Êtes-vous sûr de vouloir dissocier <strong>{professeurADissocier.prof.name}</strong> du cours <strong>{professeurADissocier.cours.type_cours}</strong> du <strong>{professeurADissocier.cours.jour_semaine || professeurADissocier.cours.jour}</strong> ?
            </p>
          )
        )}
      </ModalConfirmation>

      {/* Modal suppression cours */}
      <ModalConfirmation
        title="Confirmer la suppression"
        isOpen={showSupprimerModal}
        onClose={onAnnulerSuppression}
        onConfirm={onConfirmerSuppression}
        confirmText="Oui, supprimer"
        variant="danger"
      >
        {coursASupprimer && (
          <p>
            Êtes-vous sûr de vouloir supprimer le cours <strong>{coursASupprimer.type_cours}</strong> du <strong>{coursASupprimer.jour_semaine || coursASupprimer.jour}</strong> ?
            <br />
            <span style={{ color: 'red', fontSize: '0.9rem' }}>Cette action est irréversible.</span>
          </p>
        )}
      </ModalConfirmation>

      {/* Modal ajout/modification résultat */}
      <ModalConfirmation
        title={ajoutSuccess ? "Opération réussie" : "Erreur"}
        isOpen={showAjoutModal}
        onClose={onFermerAjoutModal}
      >
        <p style={{ color: ajoutSuccess ? 'green' : 'red' }}>
          {ajoutMessage}
        </p>
      </ModalConfirmation>

      {/* Modal confirmation modifications */}
      <ModalConfirmation
        title="Confirmer les modifications"
        isOpen={showConfirmModificationModal}
        onClose={onAnnulerConfirmationModification}
        onConfirm={onConfirmerModification}
        confirmText="Oui, appliquer les modifications"
      >
        <div>
          <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
            Les modifications suivantes vont être appliquées au cours <strong>{originalCours?.type_cours}</strong> du <strong>{originalCours?.jour}</strong> :
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
      </ModalConfirmation>
    </>
  );
};

export default ModalsCours;
