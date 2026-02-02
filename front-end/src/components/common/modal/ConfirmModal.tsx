import React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  ButtonVariant
} from '@patternfly/react-core';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'secondary';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'primary'
}) => {
  const getButtonVariant = (): ButtonVariant => {
    switch (variant) {
      case 'danger':
        return ButtonVariant.danger;
      case 'warning':
        return ButtonVariant.warning;
      case 'secondary':
        return ButtonVariant.secondary;
      default:
        return ButtonVariant.primary;
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button
          key="confirm"
          variant={getButtonVariant()}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>,
        <Button
          key="cancel"
          variant={ButtonVariant.link}
          onClick={onClose}
        >
          {cancelText}
        </Button>
      ]}
    >
      <p>{message}</p>
    </Modal>
  );
};

export default ConfirmModal;

