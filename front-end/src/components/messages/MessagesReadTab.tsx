import React from 'react';
import {
  Card,
  CardBody,
  Title,
  EmptyState
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';

interface MessagesReadTabProps {
  messagesLus: any[];
  onMessageClick: (message: any) => void;
  onDeleteMessage: (messageId: number) => void;
  onShowDeleteModal: (message: any) => void; // NOUVEAU
}

const MessagesReadTab: React.FC<MessagesReadTabProps> = ({
  messagesLus,
  onMessageClick,
  onDeleteMessage,
  onShowDeleteModal // NOUVEAU
}) => {
  // Styles spécifiques aux messages lus
  const getMessageStyle = () => ({
    padding: '15px',
    margin: '10px 0',
    border: '1px solid #d4edda',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8f9fa',
    borderLeft: '4px solid #28a745',
    opacity: 0.8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    ':hover': {
      backgroundColor: '#e9ecef',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    }
  });

  const getTitleStyle = () => ({
    fontWeight: 'normal',
    color: '#6c757d',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  const getContentStyle = () => ({
    color: '#868e96',
    marginTop: '8px',
    fontSize: '14px',
    lineHeight: '1.4'
  });

  const getDateStyle = () => ({
    color: '#adb5bd',
    fontSize: '12px',
    marginTop: '8px'
  });

  return (
    <div className="messages-read-section">
      <Card className="messages-card">
        <CardBody>
          <div className="messages-header">
            <Title headingLevel="h2" size="xl" className="messages-title">
              <CheckCircleIcon style={{ color: '#28a745', marginRight: '10px' }} />
              Messages lus
            </Title>
            <p className="messages-subtitle">
              Messages que vous avez déjà consultés ({messagesLus.length} message{messagesLus.length > 1 ? 's' : ''})
            </p>
          </div>

          {messagesLus.length === 0 ? (
            <EmptyState>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircleIcon style={{ fontSize: '3rem', color: '#28a745', marginBottom: '1rem' }} />
                <Title headingLevel="h4" size="lg">
                  Aucun message lu
                </Title>
                <p>Vous n'avez encore lu aucun message.</p>
              </div>
            </EmptyState>
          ) : (
            <div className="read-messages-list">
              {messagesLus.map((message) => (
                <div
                  key={message.id}
                  style={getMessageStyle()}
                  onClick={() => onMessageClick(message)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={getTitleStyle()}>
                        <CheckCircleIcon style={{ color: '#28a745', fontSize: '16px' }} />
                        {message.title}
                      </h4>
                      <p style={getContentStyle()}>
                        {message.content.length > 120 
                          ? `${message.content.substring(0, 120)}...` 
                          : message.content
                        }
                      </p>
                      <div style={getDateStyle()}>
                        <strong>Reçu le:</strong> {new Date(message.date_envoi).toLocaleString()}
                        {message.date_lecture && (
                          <span style={{ marginLeft: '20px' }}>
                            <strong>Lu le:</strong> {new Date(message.date_lecture).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ marginLeft: '15px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowDeleteModal(message); // MODIFIÉ: Utiliser la modal au lieu de confirm
                        }}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          opacity: 0.8
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

export default MessagesReadTab;
