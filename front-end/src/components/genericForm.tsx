// components/GenericForm.tsx
import React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  Button
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';

interface GenericFormProps {
  formData: any;
  setFormData?: React.Dispatch<any>;
  selectOptions: any;
  selectOpenStates: { [key: string]: boolean };
  setSelectOpenStates?: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  onChange: (value: string, key: string) => void;
  onSelectToggle: (key: string, isOpen: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  formatLabel?: (label: string) => string;
  existenceMessages?: { [key: string]: string }; // <-- Ajout ici
}


const formatLabel = (label: string) => {
  let formatted = label.replace(/_/g, ' ');
  if (formatted.endsWith(' id')) formatted = formatted.slice(0, -3);
  if (formatted.toLowerCase() === 'first name') return 'Nom';
  if (formatted.toLowerCase() === 'last name') return 'Prénom';
  if (formatted.toLowerCase() === 'date of birth') return 'Date de naissance';
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const GenericForm: React.FC<GenericFormProps> = ({
  formData,
  selectOptions,
  selectOpenStates,
  onChange,
  onSelectToggle,
  onSubmit,
  existenceMessages // <-- Ajout ici
}) => {
  const renderToggle = (key: string) => (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => onSelectToggle(key, !selectOpenStates[key])}
      isExpanded={selectOpenStates[key]}
    >
      {
        selectOptions[key]?.find((opt: any) => opt.id === formData[key])?.nom_plan ||
        selectOptions[key]?.find((opt: any) => opt.id === formData[key])?.nom_role ||
        selectOptions[key]?.find((opt: any) => opt.id === formData[key])?.grade_id ||
        selectOptions[key]?.find((opt: any) => opt.id === formData[key])?.genre_name ||
        'Sélectionner'
      }
    </MenuToggle>
  );

  return (
    <Form onSubmit={onSubmit}>
      {Object.keys(formData).map((key) => {
        if (key === 'id') return null;

        if (key.endsWith('_id')) {
          return (
            <FormGroup label={formatLabel(key)} fieldId={key} key={key}>
              <Select
                id={key}
                isOpen={selectOpenStates[key] || false}
                selected={formData[key]}
                onSelect={(_e, value) => {
                  onChange(value as string, key);
                  onSelectToggle(key, false);
                }}
                onOpenChange={(isOpen: boolean) => onSelectToggle(key, isOpen)}
                toggle={renderToggle(key)}
                shouldFocusToggleOnSelect
              >
                <SelectList>
                  {(selectOptions[key] || []).map((option: any) => (
                    <SelectOption key={option.id} value={option.id}>
                      {option.nom_plan || option.nom_role || option.grade_id || option.genre_name || `ID ${option.id}`}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </FormGroup>
          );
        }

        const inputType = key.toLowerCase().includes('email') ? 'email' : 'text';
        return (
          <FormGroup label={formatLabel(key)} fieldId={key} key={key}>
            <TextInput
              isRequired
              type={inputType}
              id={key}
              name={key}
              value={formData[key]}
              onChange={(_event, value) => onChange(value, key)}
            />
            {/* Vérification du format email */}
            {key === 'email' && formData[key] && formData[key].length > 0 && !formData[key].includes('@') && (
              <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>
                Le champ email doit contenir '@'
              </div>
            )}
            {existenceMessages && formData[key] && formData[key].length > 0 && existenceMessages[key] && (
              <div
                style={{
                  color: existenceMessages[key].toLowerCase().includes('disponible') ? 'green' : 'red',
                  fontSize: '0.95rem',
                  marginTop: 4
                }}
              >
                {existenceMessages[key]}
              </div>
            )}
          </FormGroup>
        );
      })}
      <Button type="submit" variant="primary">Ajouter</Button>
    </Form>
  );
};

export default GenericForm;
