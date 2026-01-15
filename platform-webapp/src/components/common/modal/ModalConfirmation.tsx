import React from 'react';
import ModalWithHelp from './modalwithhelp';

interface ModalConfirmationProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  variant?: 'primary' | 'danger' | 'success' | 'warning';
  isDisabled?: boolean;
  children?: React.ReactNode;
}

const ModalConfirmation: React.FC<ModalConfirmationProps> = ({
  title,
  isOpen,
  onClose,
  onConfirm,
  confirmText = 'Confirmer',
  variant = 'primary',
  isDisabled = false,
  children,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalWithHelp
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmText={onConfirm ? confirmText : undefined}
      cancelText={onConfirm ? 'Annuler' : undefined}
      variant={variant}
      isDisabled={isDisabled}
      style={{
        textAlign: 'left'
      }}
      actionsPosition="left"
    >
      {children ? children : (
        <div>
          <p>Contenu par défaut de la modal.</p>
        </div>
      )}
    </ModalWithHelp>
  );
};

export default ModalConfirmation;
