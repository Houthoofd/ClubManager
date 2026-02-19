import React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Title
} from '@patternfly/react-core';

interface MessageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: number;
    title: string;
    content: string;
    sender: string;
    date_envoi: string;
    lu: boolean;
    date_lecture?: string;
  } | null;
  onMarkAsRead?: (messageId: number) => void;
  onDelete?: (messageId: number) => void;
}

const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  isOpen,
  onClose,
  message,
  onMarkAsRead,
  onDelete
}) => {
  if (!message) return null;

  const getModalHeaderStyle = () => ({
    backgroundColor: message.lu ? '#e8f5e8' : '#e3f2fd',
    borderBottom: `3px solid ${message.lu ? '#28a745' : '#007bff'}`,
    padding: '20px'
  });

  const getTitleStyle = () => ({
    color: message.lu ? '#155724' : '#0d47a1',
    fontWeight: message.lu ? 'normal' : 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  });

  const getStatusIcon = () => {
    if (message.lu) {
      return (
        <span style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          ✓ Message lu
        </span>
      );
    }
    return (
      <span style={{
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        animation: 'pulse 2s infinite'
      }}>
        ● Nouveau message
      </span>
    );
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title=""
      isOpen={isOpen}
      onClose={onClose}
      className="message-detail-modal"
    >
      {/* Header personnalisé avec style conditionnel */}
      <div style={getModalHeaderStyle()}>
        <h2 style={getTitleStyle()}>
          {message.title}
          {getStatusIcon()}
        </h2>
        <div style={{ 
          color: message.lu ? '#155724' : '#0d47a1', 
          fontSize: '14px',
          marginTop: '10px'
        }}>
          <strong>De:</strong> {message.sender} | 
          <strong> Reçu le:</strong> {new Date(message.date_envoi).toLocaleString()}
          {message.lu && message.date_lecture && (
            <>
              <br />
              <strong>Lu le:</strong> {new Date(message.date_lecture).toLocaleString()}
            </>
          )}
        </div>
      </div>

      {/* Contenu du message */}
      <div style={{ 
        padding: '20px',
        backgroundColor: message.lu ? '#f8f9fa' : '#ffffff',
        minHeight: '200px'
      }}>
        <div style={{
          backgroundColor: message.lu ? '#ffffff' : '#f8f9ff',
          padding: '15px',
          borderRadius: '8px',
          border: `1px solid ${message.lu ? '#dee2e6' : '#e3f2fd'}`,
          lineHeight: '1.6'
        }}>
          {message.content}
        </div>
      </div>

      {/* Actions */}
      <div style={{ 
        padding: '20px',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div>
          {!message.lu && onMarkAsRead && (
            <button
              onClick={() => onMarkAsRead(message.id)}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✓ Marquer comme lu
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
                  onDelete(message.id);
                  onClose();
                }
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🗑️ Supprimer
            </button>
          )}
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* CSS pour l'animation pulse */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Modal>
  );
};


export default MessageDetailModal;
