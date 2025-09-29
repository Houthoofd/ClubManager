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
}

const MessagesReceivedTab: React.FC<MessagesReceivedTabProps> = ({
  messagesRecus,
  onMessageClick,
  onMarkAsRead,
  onDeleteMessage
}) => {
  return (
    <div className="messages-list-section">
      <Card className="messages-card">
        <CardBody>
          <div className="messages-header">
            <Title headingLevel="h2" size="xl" className="messages-title">
              Mes messages
            </Title>
            <p className="messages-subtitle">
              Consultez les messages qui vous ont été envoyés ({messagesRecus.length} message{messagesRecus.length > 1 ? 's' : ''})
            </p>
          </div>

          {messagesRecus.length === 0 ? (
            <EmptyState>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <InboxIcon style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }} />
                <Title headingLevel="h4" size="lg">
                  Aucun message
                </Title>
                <p>Vous n'avez reçu aucun message pour le moment.</p>
              </div>
            </EmptyState>
          ) : (
            <div className="received-messages-list">
              {messagesRecus.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onMessageClick={onMessageClick}
                  onMarkAsRead={onMarkAsRead}
                  onDeleteMessage={onDeleteMessage}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default MessagesReceivedTab;
