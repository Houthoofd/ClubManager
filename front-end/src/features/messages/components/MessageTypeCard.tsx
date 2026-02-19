import React from "react";
import {
  Card,
  CardBody,
  Title,
  Button,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Divider,
} from "@patternfly/react-core";
import { EditIcon, TrashIcon } from "@patternfly/react-icons";

interface MessageTypeCardProps {
  type: {
    id: number;
    title: string;
    content: string;
  };
  isEditing: boolean;
  editFormData: { title: string; content: string };
  onEdit: (id: number) => void;
  onCancelEdit: () => void;
  onSave: (id: number) => void;
  onDelete: (id: number) => void;
  onFormDataChange: (field: string, value: string) => void;
}

const MessageTypeCard: React.FC<MessageTypeCardProps> = ({
  type,
  isEditing,
  editFormData,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onFormDataChange,
}) => {
  return (
    <Card className="message-type-card">
      <CardBody>
        {isEditing ? (
          <div className="editing-form">
            <Form>
              <FormGroup
                label="Titre"
                fieldId={`edit-title-${type.id}`}
                className="modern-form-group"
              >
                <TextInput
                  type="text"
                  value={editFormData.title || ""}
                  onChange={(
                    _event: React.FormEvent<HTMLInputElement>,
                    value: string,
                  ) => onFormDataChange("title", value)}
                  className="modern-input"
                />
              </FormGroup>
              <FormGroup
                label="Contenu"
                fieldId={`edit-content-${type.id}`}
                className="modern-form-group"
              >
                <TextArea
                  value={editFormData.content || ""}
                  onChange={(
                    _event: React.FormEvent<HTMLTextAreaElement>,
                    value: string,
                  ) => onFormDataChange("content", value)}
                  className="modern-textarea"
                  rows={4}
                />
              </FormGroup>
            </Form>
            <div className="editing-actions">
              <Button
                variant="primary"
                onClick={() => onSave(type.id)}
                className="save-button"
              >
                Sauvegarder
              </Button>
              <Button
                variant="secondary"
                onClick={onCancelEdit}
                className="cancel-button"
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="message-display">
            <div className="message-header">
              <Title headingLevel="h4" size="md" className="message-title">
                {type.title}
              </Title>
              <div className="message-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(type.id)}
                  className="edit-btn"
                >
                  <EditIcon />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(type.id)}
                  className="delete-btn"
                >
                  <TrashIcon />
                </Button>
              </div>
            </div>
            <Divider />
            <div className="message-content">
              <p className="message-text">{type.content}</p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default MessageTypeCard;
