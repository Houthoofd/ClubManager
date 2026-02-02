import React from 'react';
import { BaseModal } from '../common/modal/BaseModal';
import { 
  Button, 
  Alert
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: {
    id: number;
    title: string;
    content: string;
    lu: boolean;
  } | null;
  isLoading?: boolean;
}

const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  isLoading = false
}) => {
  if (!message) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer le message"
      size="medium"
      actions={[
        <Button
          key="delete"
          variant="danger"
          onClick={handleConfirm}
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          🗑️ Supprimer
        </Button>,
        <Button
          key="cancel"
          variant="link"
          onClick={onClose}
          isDisabled={isLoading}
        >
          Annuler
        </Button>
      ]}
    >
      <div style={{ padding: '20px 0' }}>
        <Alert
          variant="warning"
          title="Attention"
          isInline
          customIcon={<ExclamationTriangleIcon />}
          style={{ marginBottom: '20px' }}
        >
          Cette action est irréversible. Le message sera définitivement supprimé.
        </Alert>

        <div>
          <p style={{ marginBottom: '15px' }}>
            Êtes-vous sûr de vouloir supprimer ce message ?
          </p>
          
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '15px'
          }}>
            <h4 style={{ 
              margin: '0 0 10px 0',
              color: '#495057',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {message.lu ? '✅' : '📮'} {message.title}
            </h4>
            
            <p style={{ 
              margin: 0,
              color: '#6c757d',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {message.content.length > 150 
                ? `${message.content.substring(0, 150)}...` 
                : message.content
              }
            </p>

            <div style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#868e96'
            }}>
              Statut: {message.lu ? 'Message lu' : 'Message non lu'}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteMessageModal;
