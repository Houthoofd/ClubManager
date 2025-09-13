import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalVariant,
  Button,
} from '@patternfly/react-core';

interface ModalConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

interface ModalResultatProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export const ModalConfirmation: React.FC<ModalConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "primary"
}) => {
  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-body"
    >
      <ModalHeader title={title} labelId="confirm-modal-title" />
      <ModalBody id="confirm-modal-body">
        <span dangerouslySetInnerHTML={{ __html: message }} />
      </ModalBody>
      <ModalFooter>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
        <Button variant="link" onClick={onClose}>
          {cancelText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const ModalResultat: React.FC<ModalResultatProps> = ({
  isOpen,
  onClose,
  title,
  message,
  isLoading = false
}) => {
  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="result-modal-title"
      aria-describedby="result-modal-body"
    >
      <ModalHeader title={title} labelId="result-modal-title" />
      <ModalBody id="result-modal-body">
        {isLoading ? (
          <span>Chargement...</span>
        ) : (
          <span>{message}</span>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose} isDisabled={isLoading}>
          OK
        </Button>
      </ModalFooter>
    </Modal>
  );
};
