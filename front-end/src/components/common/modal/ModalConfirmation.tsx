import React from 'react';
import { ModalWithHelp } from './modalwithhelp';

interface ModalConfirmationProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'secondary';
}

const ModalConfirmation: React.FC<ModalConfirmationProps> = ({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = 'primary'
}) => {
  return (
    <ModalWithHelp
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmText={onConfirm ? confirmText : undefined}
      cancelText={onConfirm ? cancelText : undefined}
    >
      {children}
    </ModalWithHelp>
  );
};

export default ModalConfirmation;
