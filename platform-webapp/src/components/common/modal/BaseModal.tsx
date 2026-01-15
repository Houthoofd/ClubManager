import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, Button } from '@patternfly/react-core';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  actions?: React.ReactNode[];
  help?: React.ReactNode;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  children,
  actions = [],
  help,
}) => {
  return (
    <Modal
      variant={size}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-body"
    >
      <ModalHeader
        title={title}
        labelId="modal-title"
        help={help}
      />
      <ModalBody id="modal-body">
        {children}
      </ModalBody>
      <ModalFooter>
        {actions.map((action, index) => action)}
      </ModalFooter>
    </Modal>
  );
};

export default BaseModal;
