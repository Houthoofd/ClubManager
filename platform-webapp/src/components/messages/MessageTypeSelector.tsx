import React from 'react';
import {
  FormGroup,
  FormSelect,
  FormSelectOption
} from '@patternfly/react-core';

interface MessageTypeSelectorProps {
  typesMessages: any[];
  selectedType: string;
  onTypeSelect: (typeId: string) => void;
}

const MessageTypeSelector: React.FC<MessageTypeSelectorProps> = ({
  typesMessages,
  selectedType,
  onTypeSelect
}) => {
  return (
    <FormGroup 
      label="Type de message" 
      isRequired 
      fieldId="type-select" 
      className="modern-form-group"
    >
      <FormSelect 
        value={selectedType} 
        onChange={(e) => onTypeSelect(e.currentTarget.value)}
        className="message-type-select"
      >
        <FormSelectOption value="" label="Choisissez un type de message..." />
        {typesMessages.map((type) => (
          <FormSelectOption 
            key={type.id} 
            value={type.id} 
            label={type.title} 
          />
        ))}
      </FormSelect>
      {selectedType && (
        <div className="message-preview">
          <small>Aperçu du message :</small>
          <div className="preview-content">
            {typesMessages.find(t => t.id.toString() === selectedType)?.content}
          </div>
        </div>
      )}
    </FormGroup>
  );
};

export default MessageTypeSelector;
