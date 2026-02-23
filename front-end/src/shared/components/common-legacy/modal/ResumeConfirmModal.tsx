import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, Button } from '@patternfly/react-core';
import { ArrowRightIcon } from '@/shared/icons';

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

interface ResumeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  modificationsResume: ModificationItem[];
  confirmText?: string;
  cancelText?: string;
}

export const ResumeConfirmModal: React.FC<ResumeConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  modificationsResume,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}) => {
  return (
    <Modal
      variant="large"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="resume-confirm-modal-title"
      aria-describedby="resume-confirm-modal-body"
    >
      <ModalHeader
        title={title}
        labelId="resume-confirm-modal-title"
      />
      <ModalBody id="resume-confirm-modal-body">
        <div style={{ padding: '1rem' }}>
          <p style={{ marginBottom: '1rem' }}>{message}</p>
          <p style={{ marginBottom: '1rem' }}>Récapitulatif des modifications :</p>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
          }}>
            {modificationsResume.map((modification, index) => (
              <div key={index} style={{
                marginBottom: index < modificationsResume.length - 1 ? '0.75rem' : '0',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <strong style={{ minWidth: 'fit-content' }}>{modification.field}:</strong>
                <span style={{
                  backgroundColor: '#ffebee',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '3px',
                  border: '1px solid #ffcdd2',
                  fontSize: '0.9rem',
                }}>
                  {modification.oldValue}
                </span>
                <ArrowRightIcon style={{ color: '#666', fontSize: '0.8rem' }} />
                <span style={{
                  backgroundColor: '#e8f5e8',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '3px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.9rem',
                }}>
                  {modification.newValue}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="primary" onClick={onConfirm}>
          {confirmText}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          {cancelText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ResumeConfirmModal;
