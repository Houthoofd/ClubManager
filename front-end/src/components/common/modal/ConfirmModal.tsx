import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, Button } from '@patternfly/react-core';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'primary'
}) => {
  return (
    <Modal
      variant="small"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-body"
    >
      <ModalHeader
        title={title}
        labelId="confirm-modal-title"
      />
      <ModalBody id="confirm-modal-body">
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <p style={{ 
            fontSize: '1rem',
            margin: 0,
            color: '#333'
          }}>
            {message}
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button 
          key="confirm" 
          variant={variant} 
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          {cancelText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmModal;

