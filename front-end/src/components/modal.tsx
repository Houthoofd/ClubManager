import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, Button } from '@patternfly/react-core';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    navigate('/pages/connexion');
  };

  return (
    <Modal
      variant={variant}
      title={title}
      isOpen={isOpen}
      onClose={handleClose}
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
        <Button variant="link" onClick={handleClose}>
          {cancelLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ModalSize;