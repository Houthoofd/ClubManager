import React from 'react';
import {
  Card,
  CardBody,
  Title,
  EmptyState
} from '@patternfly/react-core';
import { InboxIcon } from '@patternfly/react-icons';
import MessageCard from './MessageCard';

interface MessagesReceivedTabProps {
  messagesRecus: any[];
  onMessageClick: (message: any) => void;
  onMarkAsRead: (messageId: number) => void;
  onDeleteMessage: (messageId: number) => void;
  onShowDeleteModal: (message: any) => void; // NOUVEAU
}

const MessagesReceivedTab: React.FC<MessagesReceivedTabProps> = ({
  messagesRecus,
  onMessageClick,
  onMarkAsRead,
  onDeleteMessage,
  onShowDeleteModal
}) => {
  // Filtrer seulement les messages NON LUS
  const messagesNonLus = messagesRecus.filter(message => !message.lu);

  // Calculer le nombre de messages non lus en temps réel
  const nombreMessagesNonLus = messagesRecus.filter(message => !message.lu).length;
  const nombreTotal = messagesRecus.length;

  // Styles pour les messages lus/non lus
  const getMessageStyle = (message: any) => ({
    padding: '15px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: message.lu ? '#f8f9fa' : '#ffffff',
    borderLeft: message.lu ? '4px solid #28a745' : '4px solid #007bff',
    opacity: message.lu ? 0.7 : 1,
    boxShadow: message.lu ? '0 2px 4px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.15)',
    ':hover': {
      backgroundColor: message.lu ? '#e9ecef' : '#f0f8ff',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
    }
  });

  const getTitleStyle = (message: any) => ({
    fontWeight: message.lu ? 'normal' : 'bold',
    color: message.lu ? '#6c757d' : '#212529',
    fontSize: message.lu ? '14px' : '16px'
  });

  const getContentStyle = (message: any) => ({
    color: message.lu ? '#868e96' : '#495057',
    marginTop: '8px',
    fontSize: '14px'
  });

  const getDateStyle = (message: any) => ({
    color: message.lu ? '#adb5bd' : '#6c757d',
    fontSize: '12px',
    marginTop: '5px'
  });

  const getStatusBadge = (message: any) => {
    if (message.lu) {
      return (
        <span style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: 'bold',
          marginLeft: '10px'
        }}>
          ✓ Lu
        </span>
      );
    }
    return (
      <span style={{
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: 'bold',
        marginLeft: '10px'
      }}>
        ● Non lu
      </span>
    );
  };

  return (
    <div className="messages-list-section">
      <Card className="messages-card">
        <CardBody>
          <div className="messages-header">
            <Title headingLevel="h2" size="xl" className="messages-title">
              📬 Messages non lus
            </Title>
            <p className="messages-subtitle">
              Messages qui nécessitent votre attention ({messagesNonLus.length} message{messagesNonLus.length > 1 ? 's' : ''})
            </p>
          </div>

          {messagesNonLus.length === 0 ? (
            <EmptyState>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <InboxIcon style={{ fontSize: '3rem', color: '#28a745', marginBottom: '1rem' }} />
                <Title headingLevel="h4" size="lg">
                  Tous vos messages sont lus !
                </Title>
                <p>Félicitations, vous n'avez aucun message non lu.</p>
              </div>
            </EmptyState>
          ) : (
            <div className="received-messages-list">
              {messagesNonLus.map((message) => (
                <div
                  key={message.id}
                  style={getMessageStyle(message)}
                  onClick={() => onMessageClick(message)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={getTitleStyle(message)}>
                        {message.title}
                        {getStatusBadge(message)}
                      </h4>
                      <p style={getContentStyle(message)}>
                        {message.content.length > 100 
                          ? `${message.content.substring(0, 100)}...` 
                          : message.content
                        }
                      </p>
                      <div style={getDateStyle(message)}>
                        <strong>Envoyé le:</strong> {new Date(message.date_envoi).toLocaleString()}
                        {message.lu && message.date_lecture && (
                          <span style={{ marginLeft: '15px' }}>
                            <strong>Lu le:</strong> {new Date(message.date_lecture).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
                      {!message.lu && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(message.id);
                          }}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✓ Marquer lu
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowDeleteModal(message); // MODIFIÉ: Utiliser la modal au lieu de confirm
                        }}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default MessagesReceivedTab;
