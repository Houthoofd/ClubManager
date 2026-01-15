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
  Button,
  ActionGroup,
  Title,
  Divider
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
  existenceMessages?: { [key: string]: string };
  userSchema?: any;
}

const formatLabel = (label: string) => {
  let formatted = label.replace(/_/g, ' ');
  if (formatted.endsWith(' id')) formatted = formatted.slice(0, -3);
  if (formatted.toLowerCase() === 'first name') return 'Prénom';
  if (formatted.toLowerCase() === 'last name') return 'Nom';
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const GenericForm: React.FC<GenericFormProps> = ({
  formData,
  selectOptions = {},
  selectOpenStates = {},
  onChange,
  onSelectToggle,
  onSubmit,
  existenceMessages = {},
  userSchema
}) => {
  // Vérifications de sécurité
  if (!formData || Object.keys(formData).length === 0) {
    return (
      <div className="form-loading">
        <div className="form-loading__spinner"></div>
        <p>Initialisation du formulaire...</p>
      </div>
    );
  }

  // Organiser les champs par sections
  const organizeFields = () => {
    const allKeys = Object.keys(formData).filter(key => 
      key !== 'id' && 
      key !== 'date_creation' && 
      key !== 'date_modification'
    );

    const sections = {
      identity: {
        title: 'Informations personnelles',
        description: 'Informations de base de l\'utilisateur',
        fields: allKeys.filter(key => 
          ['first_name', 'last_name', 'email', 'phone', 'date_naissance'].includes(key)
        )
      },
      account: {
        title: 'Informations du compte',
        description: 'Configuration du compte utilisateur',
        fields: allKeys.filter(key => 
          ['nom_utilisateur', 'mot_de_passe', 'role_id', 'status_id'].includes(key)
        )
      },
      profile: {
        title: 'Profil et préférences',
        description: 'Informations complémentaires',
        fields: allKeys.filter(key => 
          ['genre_id', 'abonnement_id', 'grade_id', 'adresse', 'ville', 'code_postal', 'pays'].includes(key)
        )
      },
      other: {
        title: 'Autres informations',
        description: 'Champs supplémentaires',
        fields: allKeys.filter(key => 
          !['first_name', 'last_name', 'email', 'phone', 'date_naissance',
            'nom_utilisateur', 'mot_de_passe', 'role_id', 'status_id',
            'genre_id', 'abonnement_id', 'grade_id', 'adresse', 'ville', 'code_postal', 'pays'].includes(key)
        )
      }
    };

    // Filtrer les sections vides
    return Object.entries(sections).filter(([_, section]) => section.fields.length > 0);
  };

  const getSelectedOptionLabel = (key: string, value: any) => {
    if (!value || !selectOptions[key]) return '';
    
    const option = selectOptions[key].find((opt: any) => opt.id == value);
    if (!option) return '';
    
    // Retourner le bon label selon le type d'option
    if (key === 'genre_id' && option.genre_name) return option.genre_name;
    if (key === 'abonnement_id' && option.nom_plan) return option.nom_plan;
    if (key === 'role_id' && option.nom_role) return option.nom_role;
    if (key === 'status_id' && option.nom_status) return option.nom_status;
    if (key === 'grade_id' && option.grade_id) return option.grade_id; // Ajout pour les grades
    
    // Fallback générique
    return option.nom || option.name || option.label || option.genre_name || 
           option.nom_plan || option.nom_role || option.nom_status || option.grade_id || 
           `ID ${option.id}`;
  };

  const renderToggle = (key: string) => (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => onSelectToggle(key, !selectOpenStates[key])}
      isExpanded={selectOpenStates[key] || false}
      className="modern-select-toggle"
    >
      {formData[key] ? 
        getSelectedOptionLabel(key, formData[key]) || `Sélection ${formData[key]}`
        : `Sélectionner ${formatLabel(key)}`
      }
    </MenuToggle>
  );

  const renderField = (key: string) => {
    const value = formData[key] || '';
    const isRequired = !['genre_id', 'abonnement_id', 'grade_id', 'adresse', 'ville', 'code_postal', 'pays'].includes(key);
    const hasError = existenceMessages[key]?.toLowerCase().includes('déjà utilisé') || 
                    (key === 'email' && value && !value.includes('@'));

    if (key.endsWith('_id')) {
      return (
        <div className="modern-form-field" key={key}>
          <FormGroup 
            label={formatLabel(key)} 
            fieldId={key}
            className="modern-form-group"
            isRequired={isRequired}
          >
            <Select
              id={key}
              aria-label={formatLabel(key)}
              isOpen={selectOpenStates[key] || false}
              selected={formData[key]}
              onSelect={(_e, value) => {
                onChange(String(value), key);
                onSelectToggle(key, false);
              }}
              onOpenChange={(isOpen: boolean) => onSelectToggle(key, isOpen)}
              toggle={renderToggle(key)}
              shouldFocusToggleOnSelect
              className="modern-select"
            >
              <SelectList>
                {(selectOptions[key] || []).map((option: any) => {
                  // Gestion spécifique pour chaque type d'option
                  let optionLabel = '';
                  
                  if (key === 'genre_id' && option.genre_name) {
                    optionLabel = option.genre_name;
                  } else if (key === 'abonnement_id' && option.nom_plan) {
                    optionLabel = option.nom_plan;
                  } else if (key === 'role_id' && option.nom_role) {
                    optionLabel = option.nom_role;
                  } else if (key === 'status_id' && option.nom_status) {
                    optionLabel = option.nom_status;
                  } else if (key === 'grade_id' && option.grade_id) {
                    optionLabel = option.grade_id;
                  } else {
                    // Fallback générique
                    optionLabel = option.nom || option.name || option.label || 
                                 option.genre_name || option.nom_plan || option.nom_role || 
                                 option.nom_status || option.grade_id || `ID ${option.id}`;
                  }
                  
                  return (
                    <SelectOption key={option.id} value={option.id} className="modern-select-option">
                      {optionLabel}
                    </SelectOption>
                  );
                })}
              </SelectList>
            </Select>
            {existenceMessages[key] && (
              <div className="field-error">
                {existenceMessages[key]}
              </div>
            )}
          </FormGroup>
        </div>
      );
    }

    const inputType = key.toLowerCase().includes('email') ? 'email' : 
                     key.toLowerCase().includes('password') ? 'password' : 
                     key.toLowerCase().includes('date') ? 'date' : 'text';
    
    return (
      <div className="modern-form-field" key={key}>
        <FormGroup 
          label={formatLabel(key)} 
          fieldId={key}
          className="modern-form-group"
          isRequired={isRequired}
        >
          <TextInput
            isRequired={isRequired}
            type={inputType}
            id={key}
            name={key}
            aria-label={formatLabel(key)}
            value={value}
            onChange={(_event, value) => onChange(value, key)}
            className={`modern-text-input ${hasError ? 'error' : ''}`}
            placeholder={`Entrez ${formatLabel(key).toLowerCase()}`}
          />
          {/* Vérification du format email */}
          {key === 'email' && value && !value.includes('@') && (
            <div className="field-error">
              Le champ email doit contenir '@'
            </div>
          )}
          {/* Message d'unicité pour l'email */}
          {key === 'email' && value && existenceMessages[key]?.toLowerCase().includes('déjà utilisé') && (
            <div className="field-error">
              {existenceMessages[key]}
            </div>
          )}
        </FormGroup>
      </div>
    );
  };

  const sections = organizeFields();
  const isEmailUsed = existenceMessages['email']?.toLowerCase().includes('déjà utilisé');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Appeler onSubmit qui ouvrira la modal de confirmation
    onSubmit(e);
  };

  return (
    <div className="modern-form">
      <Form onSubmit={handleFormSubmit} className="modern-form-container">
        {sections.map(([sectionKey, section], index) => (
          <div key={sectionKey} className="form-section">
            <div className="form-section-header">
              <Title headingLevel="h4" size="md" className="form-section-title">
                {section.title}
              </Title>
              <p className="form-section-description">
                {section.description}
              </p>
            </div>
            
            <div className="form-section-fields">
              {section.fields.map(key => renderField(key))}
            </div>
            
            {index < sections.length - 1 && <Divider className="form-section-divider" />}
          </div>
        ))}
        
        <div className="modern-form-actions">
          <Button 
            type="submit" 
            variant="primary" 
            isDisabled={isEmailUsed}
            className="modern-submit-button"
          >
            Créer l'utilisateur
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default GenericForm;


