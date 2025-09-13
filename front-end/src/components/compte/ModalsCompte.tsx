import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalVariant,
  Button,
} from '@patternfly/react-core';

interface ModalsCompteProps {
  isModalOpen: boolean;
  modalMessage: string;
  onCloseModal: () => void;
}

const ModalsCompte: React.FC<ModalsCompteProps> = ({
  isModalOpen,
  modalMessage,
  onCloseModal,
}) => {
  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isModalOpen}
      onClose={onCloseModal}
    >
      <ModalHeader title="Résumé des changements" />
      <ModalBody>
        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
          {modalMessage}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="primary" onClick={onCloseModal}>
          OK
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ModalsCompte;
