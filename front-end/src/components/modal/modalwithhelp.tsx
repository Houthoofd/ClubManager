import { Modal, ModalBody, ModalFooter, ModalHeader, Button } from '@patternfly/react-core';
import type { ReactNode } from 'react';

export interface ModalWithHelpProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  help?: ReactNode;
  footer?: ReactNode;
  description?: ReactNode; // Ajout pour compatibilité avec l'usage
  onConfirm?: () => void;  // Ajout pour bouton confirmer
  confirmText?: string;
  cancelText?: string;
}

export const ModalWithHelp: React.FC<ModalWithHelpProps> = ({
  isOpen,
  onClose,
  title = 'Information',
  children,
  help,
  footer,
  description,
  onConfirm,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}) => {
  return (
    <Modal
      variant="small"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="modal-with-help-title"
      aria-describedby="modal-with-help-body"
    >
      <ModalHeader title={title} labelId="modal-with-help-title" help={help} />
      <ModalBody id="modal-with-help-body">
        {description}
        {children}
      </ModalBody>
      <ModalFooter>
        {footer ? (
          footer
        ) : onConfirm ? (
          <>
            <Button variant="primary" onClick={onConfirm}>
              {confirmText}
            </Button>
            <Button variant="link" onClick={onClose}>
              {cancelText}
            </Button>
          </>
        ) : (
          <Button variant="link" onClick={onClose}>
            Fermer
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
