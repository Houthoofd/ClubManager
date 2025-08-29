import { Modal, ModalBody, ModalFooter, ModalHeader, Button } from '@patternfly/react-core';
import type { ReactNode } from 'react';

export interface ModalWithHelpProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  help?: ReactNode;
  footer?: ReactNode;
}

export const ModalWithHelp: React.FC<ModalWithHelpProps> = ({
  isOpen,
  onClose,
  title = 'Information',
  children,
  help,
  footer,
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
        {children}
      </ModalBody>
      <ModalFooter>
        {footer ? footer : (
          <Button variant="link" onClick={onClose}>
            Fermer
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
