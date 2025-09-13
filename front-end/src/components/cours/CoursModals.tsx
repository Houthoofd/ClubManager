import React from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
} from '@patternfly/react-core';

interface CoursModalsProps {
  isModalOpen: boolean;
  successMessage: string | null;
  professeurADissocier: { cours: any; prof: any } | null;
  onAnnulerDissociation: () => void;
  onConfirmerDissociation: () => void;
  showSupprimerModal: boolean;
  coursASupprimer: any | null;
  onAnnulerSuppression: () => void;
  onConfirmerSuppression: () => void;
  showAjoutModal: boolean;
  ajoutSuccess: boolean;
  ajoutMessage: string | null;
  onFermerAjoutModal: () => void;
  showConfirmModificationModal: boolean;
  modificationsResume: string[];
  originalCours: any | null;
  onAnnulerConfirmationModification: () => void;
  onConfirmerModification: () => void;
}

const CoursModals: React.FC<CoursModalsProps> = ({
  isModalOpen,
  successMessage,
  professeurADissocier,
  onAnnulerDissociation,
  onConfirmerDissociation,
  showSupprimerModal,
  coursASupprimer,
  onAnnulerSuppression,
  onConfirmerSuppression,
  showAjoutModal,
  ajoutSuccess,
  ajoutMessage,
  onFermerAjoutModal,
  showConfirmModificationModal,
  modificationsResume,
  onAnnulerConfirmationModification,
  onConfirmerModification,
}) => {
  return (
    <>
      {/* Modal de dissociation */}
      <Modal
        variant="small"
        isOpen={isModalOpen}
        onClose={onAnnulerDissociation}
        className="modern-card"
      >
        <ModalHeader title="Dissocier le professeur" />
        <ModalBody>
          {professeurADissocier && (
            <p>
              Êtes-vous sûr de vouloir dissocier <strong>{professeurADissocier.prof.name}</strong> 
              du cours <strong>{professeurADissocier.cours.type_cours}</strong> du {professeurADissocier.cours.jour} ?
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="danger" onClick={onConfirmerDissociation}>
            Confirmer
          </Button>
          <Button variant="link" onClick={onAnnulerDissociation}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de suppression */}
      <Modal
        variant="small"
        isOpen={showSupprimerModal}
        onClose={onAnnulerSuppression}
        className="modern-card"
      >
        <ModalHeader title="Supprimer le cours" />
        <ModalBody>
          {coursASupprimer && (
            <p>
              Êtes-vous sûr de vouloir supprimer le cours <strong>{coursASupprimer.type_cours}</strong> 
              du {coursASupprimer.jour} ?
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="danger" onClick={onConfirmerSuppression}>
            Supprimer
          </Button>
          <Button variant="link" onClick={onAnnulerSuppression}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de confirmation de modification */}
      <Modal
        variant="medium"
        isOpen={showConfirmModificationModal}
        onClose={onAnnulerConfirmationModification}
        className="modern-card"
      >
        <ModalHeader title="Confirmer les modifications" />
        <ModalBody>
          <p style={{ marginBottom: '1rem' }}>
            Vous êtes sur le point d'apporter les modifications suivantes :
          </p>
          <div className="cours-modification-list">
            {modificationsResume.map((modif, index) => (
              <div key={index} className="cours-modification-item">
                {modif}
              </div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={onConfirmerModification}>
            Confirmer
          </Button>
          <Button variant="link" onClick={onAnnulerConfirmationModification}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de résultat */}
      <Modal
        variant="small"
        isOpen={showAjoutModal}
        onClose={onFermerAjoutModal}
        className="modern-card"
      >
        <ModalHeader title={ajoutSuccess ? "Succès" : "Erreur"} />
        <ModalBody>
          <div className={ajoutSuccess ? 'cours-success-message' : 'cours-error-message'}>
            {ajoutMessage}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="link" onClick={onFermerAjoutModal}>
            Fermer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de message de succès */}
      {successMessage && (
        <Modal
          variant="small"
          isOpen={!!successMessage}
          onClose={() => {
            // Appeler la fonction de fermeture passée en props
            if (typeof onAnnulerDissociation === 'function') {
              onAnnulerDissociation();
            }
          }}
          className="modern-card"
        >
          <ModalHeader title="Information" />
          <ModalBody>
            <div className="cours-success-message">
              {successMessage}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="link" 
              onClick={() => {
                // Appeler la fonction de fermeture passée en props
                if (typeof onAnnulerDissociation === 'function') {
                  onAnnulerDissociation();
                }
              }}
            >
              Fermer
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};

export default CoursModals;
