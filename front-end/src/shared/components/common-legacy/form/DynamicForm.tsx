import React from 'react';
import { Form, FormGroup, TextInput, Button } from '@patternfly/react-core';

interface DynamicFormProps {
  data: Record<string, any>;
  keys: string[]; // Tableau de clés pour générer les champs
  onChange: (key: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ data, keys, onChange, onSubmit }) => {
  return (
    <Form onSubmit={onSubmit}>
      {keys.map((key) => (
        <FormGroup key={key} label={key} fieldId={key}>
          <TextInput
            id={key}
            value={data[key] || ''}
            onChange={(value) => onChange(key, value)}
            type="text"
          />
        </FormGroup>
      ))}
      <Button type="submit" variant="primary">
        Soumettre
      </Button>
    </Form>
  );
};

export default DynamicForm;
