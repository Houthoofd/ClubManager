import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, Button, Flex, FlexItem } from '@patternfly/react-core';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isSuccess: boolean;
  showTimer?: boolean; // Nouvelle prop pour activer le timer
  countdown?: number;  // Nouvelle prop pour le timer
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  isSuccess,
  showTimer = false,
  countdown = 0,
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%' 
        }}>
          <div>
            {showTimer && countdown > 0 && (
              <span style={{ 
                color: '#6c757d', 
                fontSize: '0.875rem' 
              }}>
                Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
              </span>
            )}
          </div>
          <Button
            key="close"
            variant="primary"
            onClick={onClose}
            style={{
              backgroundColor: isSuccess ? '#28a745' : '#dc3545',
              borderColor: isSuccess ? '#28a745' : '#dc3545',
            }}
          >
            Fermer
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default ResultModal;

