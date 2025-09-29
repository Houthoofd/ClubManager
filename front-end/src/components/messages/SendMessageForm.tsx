import React from 'react';
import {
  Card,
  CardBody,
  Title,
  Form,
  Button
} from '@patternfly/react-core';
import { PaperPlaneIcon } from '@patternfly/react-icons';
import UserSelector from './UserSelector';
import MessageTypeSelector from './MessageTypeSelector';

interface SendMessageFormProps {
  utilisateurs: any[];
  typesMessages: any[];
  selectedUsers: number[];
  selectedType: string;
  isLoading: boolean;
  onUserSelect: (userId: number) => void;
  onUserRemove: (userId: number) => void;
  onTypeSelect: (typeId: string) => void;
  onSendMessage: () => void;
}

const SendMessageForm: React.FC<SendMessageFormProps> = ({
  utilisateurs,
  typesMessages,
  selectedUsers,
  selectedType,
  isLoading,
  onUserSelect,
  onUserRemove,
  onTypeSelect,
  onSendMessage
}) => {
  return (
    <Card className="messages-card">
      <CardBody>
        <div className="messages-header">
          <Title headingLevel="h2" size="xl" className="messages-title">
            Envoyer un message
          </Title>
          <p className="messages-subtitle">
            Sélectionnez les destinataires et le type de message à envoyer
          </p>
        </div>

        <Form className="messages-form">
          <div className="form-section">
            <UserSelector
              utilisateurs={utilisateurs}
              selectedUsers={selectedUsers}
              onUserSelect={onUserSelect}
              onUserRemove={onUserRemove}
            />
          </div>

          <div className="form-section">
            <MessageTypeSelector
              typesMessages={typesMessages}
              selectedType={selectedType}
              onTypeSelect={onTypeSelect}
            />
          </div>

          <div className="form-actions">
            <Button 
              variant="primary" 
              onClick={onSendMessage}
              isDisabled={selectedUsers.length === 0 || !selectedType || isLoading}
              isLoading={isLoading}
              className="send-button"
            >
              <PaperPlaneIcon style={{ marginRight: '8px' }} />
              {isLoading ? 'Envoi en cours...' : 'Envoyer le message'}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default SendMessageForm;
