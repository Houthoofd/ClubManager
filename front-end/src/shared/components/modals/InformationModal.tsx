import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@patternfly/react-core';
import { 
  ExclamationTriangleIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  TimesCircleIcon
} from '@/shared/icons';

interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  details?: {
    actions?: {
      label: string;
      action: () => void;
      variant?: 'primary' | 'secondary' | 'danger';
    }[];
  };
}

export const InformationModal: React.FC<InformationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  details
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon style={{ color: '#f59e0b', fontSize: '2rem' }} />;
      case 'error':
        return <TimesCircleIcon style={{ color: '#ef4444', fontSize: '2rem' }} />;
      case 'success':
        return <CheckCircleIcon style={{ color: '#10b981', fontSize: '2rem' }} />;
      default:
        return <InfoCircleIcon style={{ color: '#3b82f6', fontSize: '2rem' }} />;
    }
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="information-modal-title"
    >
      <ModalHeader title={title} />
      <ModalBody>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
          {getIcon()}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '1.1rem', margin: 0, lineHeight: '1.5' }}>
              {message}
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        {details?.actions && details.actions.length > 0 ? (
          <>
            {details.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'secondary'}
                onClick={() => {
                  action.action();
                  onClose();
                }}
              >
                {action.label}
              </Button>
            ))}
            <Button variant="link" onClick={onClose}>
              Annuler
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onClose}>
            Compris
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default InformationModal;
