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
import { apiUrl } from '../pages/apiUrl';

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
  existenceMessages
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

  // Supprime la gestion de la modal ici
  // const [modalOpen, setModalOpen] = React.useState(false);
  // const [modalMessage, setModalMessage] = React.useState<string>('');

  // Supprime la fonction inutilisée
  // const resetForm = () => {
  //   Object.keys(formData).forEach((key) => {
  //     if (key !== 'id') onChange('', key);
  //   });
  // };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit(e);
    // On ne gère plus la modal ici, juste retourne le résultat
    return result;
  };

  // Ajoute un état pour bloquer le bouton si email déjà utilisé
  const isEmailUsed =
    formData.email &&
    existenceMessages &&
    existenceMessages.email &&
    existenceMessages.email.toLowerCase().includes('déjà utilisé');

  // Vérifie l'existence dès que nom, prénom et email sont remplis
  React.useEffect(() => {
    const nom = formData.last_name || formData.nom;
    const prenom = formData.first_name || formData.prenom;
    const email = formData.email;

    if (nom && prenom && email) {
      // Utilise directement apiUrl importé
      fetch(apiUrl('verification/verifier-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
        .then(res => res.json())
        .then(result => {
          if (result.exists) {
            if (typeof existenceMessages !== 'undefined') {
              existenceMessages.email = result.message || 'Cet email est déjà utilisé par un utilisateur.';
            }
          }
        });
    }
  }, [formData.last_name, formData.first_name, formData.email, existenceMessages]);

  return (
    <Form onSubmit={handleFormSubmit}>
      {Object.keys(formData).map((key) => {
        if (key === 'id') return null;

        // Le champ grade n'est pas requis
        const isRequired = key !== 'grade_id';

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
                // Retire la prop 'required' qui n'est pas supportée
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
              isRequired={isRequired}
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
            {/* Affiche le message d'unicité uniquement pour l'email */}
            {key === 'email' && formData[key] && formData[key].length > 0 && existenceMessages && existenceMessages[key] && (
              existenceMessages[key].toLowerCase().includes('déjà utilisé') ? (
                <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>
                  {existenceMessages[key]}
                </div>
              ) : null
            )}
            {/* Ne bloque pas l'inscription si le nom de famille existe déjà */}
            {/* Aucun message bloquant pour le champ 'last_name' */}
          </FormGroup>
        );
      })}
      <Button type="submit" variant="primary" isDisabled={isEmailUsed}>
        Ajouter
      </Button>
    </Form>
  );
};


export default GenericForm;

