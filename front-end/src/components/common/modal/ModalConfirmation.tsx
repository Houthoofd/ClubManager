import React from 'react';
import ModalWithHelp from './modalwithhelp'; // Utilisez la casse correcte

interface ModalConfirmationProps {
  title: string;
  isOpen: boolean; // Assurez-vous que cette propriété est utilisée
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  variant?: 'primary' | 'danger' | 'success' | 'warning';
  isDisabled?: boolean;
  children?: React.ReactNode; // Ajoutez cette ligne pour accepter les enfants
}

const ModalConfirmation: React.FC<ModalConfirmationProps> = ({
  title,
  isOpen,
  onClose,
  onConfirm,
  confirmText = 'Confirmer',
  variant = 'primary',
  isDisabled = false,
  children, // Ajoutez `children` ici
}) => {
  console.log('ModalConfirmation: isOpen =', isOpen); // Ajoutez ce log pour vérifier si la modal est rendue
  if (!isOpen) {
    console.log('ModalConfirmation: La modal est fermée.'); // Ajoutez un log pour diagnostiquer
    return null; // Si `isOpen` est `false`, ne rien rendre
  }
  console.log('ModalConfirmation: La modal est ouverte.'); // Ajoutez un log pour diagnostiquer

  return (
    <div role="dialog" aria-modal="true" inert={!isOpen}>
      <ModalWithHelp
        title={title}
        isOpen={isOpen} // Vérifiez que cette propriété est utilisée ici
        onClose={() => {
          console.log('ModalConfirmation: Fermeture de la modal.'); // Ajoutez un log pour diagnostiquer
          onClose();
        }}
        onConfirm={() => {
          console.log('ModalConfirmation: Bouton de confirmation cliqué.'); // Ajoutez un log pour diagnostiquer
          if (onConfirm) {
            onConfirm();
          }
        }}
        confirmText={onConfirm ? confirmText : undefined}
        cancelText={onConfirm ? 'Annuler' : undefined}
        variant={variant}
        isDisabled={isDisabled}
      >
        {children} {/* Rendre les enfants ici */}
      </ModalWithHelp>
    </div>
  );
};

export default ModalConfirmation;
