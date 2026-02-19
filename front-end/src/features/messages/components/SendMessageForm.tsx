import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Title,
  Form,
  Button,
  FormGroup,
  Checkbox,
  Alert
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
  const [envoyerEmail, setEnvoyerEmail] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0 || !selectedType) {
      // Validation
      return;
    }

    onSendMessage();
  };

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

        <Form onSubmit={handleSubmit} className="messages-form">
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

          <FormGroup>
            <Checkbox
              id="envoyer-email-checkbox"
              label="Envoyer également une notification par email"
              description="Les destinataires recevront le message dans leur boîte de réception ET par email"
              isChecked={envoyerEmail}
              onChange={(_event, checked) => setEnvoyerEmail(checked)}
            />
          </FormGroup>

          <Alert 
            variant="info" 
            title="Mode d'envoi" 
            isInline
          >
            {envoyerEmail 
              ? "Le message sera envoyé en messagerie interne ET par email pour assurer que tous les destinataires soient informés."
              : "Le message sera envoyé uniquement en messagerie interne. Les destinataires ne recevront pas d'email de notification."
            }
          </Alert>

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
