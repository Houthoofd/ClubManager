import React from 'react';
import {
  Card,
  CardBody,
  Title
} from '@patternfly/react-core';
import { ListIcon } from '@/shared/icons';
import MessageTypeCard from './MessageTypeCard';

interface MessageTypesListTabProps {
  typesMessages: any[];
  editingId: number | null;
  editFormData: { title: string; content: string };
  onEditStart: (id: number, title: string, content: string) => void;
  onEditCancel: () => void;
  onEditSave: (id: number) => void;
  onDelete: (id: number) => void;
  onFormDataChange: (field: string, value: string) => void;
}

const MessageTypesListTab: React.FC<MessageTypesListTabProps> = ({
  typesMessages,
  editingId,
  editFormData,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onFormDataChange
}) => {
  if (typesMessages.length === 0) {
    return (
      <div className="messages-list-section">
        <Card className="empty-state-card">
          <CardBody>
            <div className="empty-state">
              <ListIcon className="empty-state-icon" />
              <Title headingLevel="h3" size="lg">Aucun type de message</Title>
              <p>Créez votre premier type de message pour commencer</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="messages-list-section">
      <div className="messages-grid">
        <div className="messages-list-header">
          <Title headingLevel="h2" size="xl" className="messages-title">
            Messages existants
          </Title>
          <p className="messages-subtitle">
            Gérez vos modèles de messages ({typesMessages.length} message{typesMessages.length > 1 ? 's' : ''})
          </p>
        </div>

        <div className="messages-list">
          {typesMessages.map((type) => (
            <MessageTypeCard
              key={type.id}
              type={type}
              isEditing={editingId === type.id}
              editFormData={editFormData}
              onEdit={(id) => onEditStart(id, type.title, type.content)}
              onCancelEdit={onEditCancel}
              onSave={onEditSave}
              onDelete={onDelete}
              onFormDataChange={onFormDataChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageTypesListTab;
