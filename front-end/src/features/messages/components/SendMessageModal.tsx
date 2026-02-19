import React, { useState } from 'react';
import {
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormSelect,
  FormSelectOption,
  FormGroup,
  Alert,
  Card,
  CardBody,
  Title,
  Badge,
  Divider
} from '@patternfly/react-core';
import { 
  PaperPlaneIcon, 
  ExclamationTriangleIcon,
  UserIcon 
} from '@patternfly/react-icons';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  typesMessages: any[];
  suggestedMessages: { typeId: number; raison: string }[];
  onSendMessage: (typeMessageId: number) => void;
  isLoading: boolean;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  user,
  typesMessages,
  suggestedMessages,
  onSendMessage,
  isLoading
}) => {
  const [selectedMessageType, setSelectedMessageType] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleMessageTypeChange = (value: string) => {
    const typeId = parseInt(value);
    setSelectedMessageType(typeId);
    setShowPreview(typeId > 0);
  };

  const handleSend = () => {
    if (selectedMessageType) {
      onSendMessage(selectedMessageType);
    }
  };

  const handleSuggestionClick = (typeId: number) => {
    setSelectedMessageType(typeId);
    setShowPreview(true);
  };

  const selectedMessage = typesMessages.find(t => t.id === selectedMessageType);

  if (!user) return null;

  return (
    <Modal
      variant={ModalVariant.large}
      title=""
      isOpen={isOpen}
      onClose={onClose}
      className="send-message-modal"
    >
      <ModalHeader>
        <div className="send-message-header">
          <Title headingLevel="h2" size="xl">
            <PaperPlaneIcon style={{ marginRight: '0.5rem' }} />
            Envoyer un message
          </Title>
          <div className="user-info">
            <UserIcon style={{ marginRight: '0.5rem' }} />
            <strong>{user.first_name} {user.last_name}</strong>
            <span style={{ marginLeft: '0.5rem', color: '#666' }}>({user.email})</span>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Messages suggérés basés sur les alertes */}
        {suggestedMessages.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Alert
              variant="warning"
              title="Messages suggérés"
              isInline
              customIcon={<ExclamationTriangleIcon />}
            >
              <p style={{ marginBottom: '1rem' }}>
                Basé sur le profil de cet utilisateur, nous recommandons ces messages :
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {suggestedMessages.map((suggestion, index) => {
                  const messageType = typesMessages.find(t => t.id === suggestion.typeId);
                  if (!messageType) return null;
                  
                  return (
                    <Button
                      key={index}
                      variant="link"
                      onClick={() => handleSuggestionClick(suggestion.typeId)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        color: '#856404',
                        fontSize: '0.875rem'
                      }}
                    >
                      {messageType.title}
                      <Badge style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                        {suggestion.raison}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </Alert>
          </div>
        )}

        {/* Sélection du type de message */}
        <FormGroup label="Type de message" fieldId="message-type-select" isRequired>
          <FormSelect
            value={selectedMessageType || ''}
            onChange={(_event, value) => handleMessageTypeChange(value as string)}
            id="message-type-select"
            aria-label="Sélectionner un type de message"
          >
            <FormSelectOption value="" label="Choisissez un type de message..." />
            {typesMessages.map(type => (
              <FormSelectOption
                key={type.id}
                value={type.id.toString()}
                label={type.title}
              />
            ))}
          </FormSelect>
        </FormGroup>

        {/* Aperçu du message */}
        {showPreview && selectedMessage && (
          <Card style={{ marginTop: '1rem' }}>
            <CardBody>
              <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem' }}>
                Aperçu du message
              </Title>
              <Divider style={{ marginBottom: '1rem' }} />
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Objet: {selectedMessage.title}
                </div>
                <div style={{ lineHeight: '1.6' }}>
                  {selectedMessage.content}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleSend}
          isDisabled={!selectedMessageType || isLoading}
          isLoading={isLoading}
          icon={<PaperPlaneIcon />}
        >
          {isLoading ? 'Envoi en cours...' : 'Envoyer le message'}
        </Button>
        <Button variant="link" onClick={onClose}>
          Annuler
        </Button>
      </ModalFooter>

      <style jsx>{`
        .send-message-modal {
          --pf-c-modal__content--MaxWidth: 800px;
        }

        .send-message-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }

        @media (max-width: 768px) {
          .send-message-modal {
            --pf-c-modal__content--MaxWidth: 95vw;
          }
        }
      `}</style>
    </Modal>
  );
};

export default SendMessageModal;
