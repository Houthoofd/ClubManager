import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, Button } from '@patternfly/react-core';
import type { ReactNode } from 'react';

interface ModalSizeProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: ModalVariant;
  title?: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

const ModalSize: React.FC<ModalSizeProps> = ({
  isOpen,
  onClose,
  variant = ModalVariant.small,
  title = 'Information',
  children,
  confirmLabel = 'OK',
  cancelLabel = 'Fermer',
  onConfirm,
}) => {
  return (
    <Modal
      variant={variant}
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-body"
    >
      <ModalHeader title={title} />
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        {onConfirm && (
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        )}
        <Button variant="link" onClick={onClose}>
          {cancelLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ModalSize;
