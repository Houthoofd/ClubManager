import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, Button, Flex, FlexItem } from '@patternfly/react-core';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isSuccess: boolean;
  closeButtonText?: string;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  isSuccess,
  closeButtonText = 'Fermer',
}) => {
  return (
    <Modal
      variant="small"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="result-modal-title"
      aria-describedby="result-modal-body"
    >
      <ModalHeader
        title={title}
        labelId="result-modal-title"
      />
      <ModalBody id="result-modal-body">
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsLg' }}>
            <FlexItem>
              <div style={{
                backgroundColor: isSuccess ? '#e8f5e8' : '#ffebee',
                padding: '1.5rem',
                borderRadius: '6px',
                border: `1px solid ${isSuccess ? '#c8e6c9' : '#ffcdd2'}`,
                maxWidth: '100%'
              }}>
                <p style={{ 
                  color: isSuccess ? '#2e7d32' : '#c62828',
                  fontSize: '1rem',
                  fontWeight: '500',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  {message}
                </p>
              </div>
            </FlexItem>
          </Flex>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          {closeButtonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ResultModal;
              
