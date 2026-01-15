import React from 'react';
import {
  Card,
  CardBody,
  Title,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button
} from '@patternfly/react-core';
import { EditIcon } from '@patternfly/react-icons';

interface CreateMessageTypeFormProps {
  formData: { title: string; content: string };
  isLoading: boolean;
  onFormChange: (field: string, value: string) => void;
  onCreateType: () => void;
}

const CreateMessageTypeForm: React.FC<CreateMessageTypeFormProps> = ({
  formData,
  isLoading,
  onFormChange,
  onCreateType
}) => {
  return (
    <Card className="messages-card">
      <CardBody>
        <div className="messages-header">
          <Title headingLevel="h2" size="xl" className="messages-title">
            Créer un type de message
          </Title>
          <p className="messages-subtitle">
            Créez un nouveau modèle de message réutilisable
          </p>
        </div>

        <Form className="messages-form">
          <div className="form-section">
            <FormGroup 
              label="Titre du message" 
              isRequired 
              fieldId="title" 
              className="modern-form-group"
            >
              <TextInput
                isRequired
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={(_event, value) => onFormChange('title', value)}
                placeholder="Ex: Rappel d'entraînement"
                className="modern-input"
              />
            </FormGroup>
          </div>

          <div className="form-section">
            <FormGroup 
              label="Contenu du message" 
              isRequired 
              fieldId="content" 
              className="modern-form-group"
            >
              <TextArea
                isRequired
                id="content"
                name="content"
                value={formData.content || ''}
                onChange={(_event, value) => onFormChange('content', value)}
                placeholder="Rédigez le contenu de votre message..."
                className="modern-textarea"
                rows={5}
              />
              <small className="helper-text">
                Ce message pourra être envoyé à plusieurs utilisateurs
              </small>
            </FormGroup>
          </div>

          <div className="form-actions">
            <Button 
              variant="primary" 
              onClick={onCreateType}
              isDisabled={!formData.title || !formData.content || isLoading}
              isLoading={isLoading}
              className="create-button"
            >
              <EditIcon style={{ marginRight: '8px' }} />
              {isLoading ? 'Création...' : 'Créer le type de message'}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default CreateMessageTypeForm;
