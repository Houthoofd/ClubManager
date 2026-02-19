import React from 'react';
import { Title } from '@patternfly/react-core';
import GenericForm from '../genericForm';

interface OngletAjoutUtilisateurProps {
  formData: any;
  selectOptions: any;
  selectOpenStates: { [key: string]: boolean };
  existenceMessages: { [key: string]: string };
  dernierUtilisateur: any;
  onChange: (value: string, key: string) => void;
  onSelectToggle: (key: string, isOpen: boolean) => void;
  onSubmit: (e: React.FormEvent) => Promise<any>;
  DynamicFormComponent: React.ReactNode; // Ajoutez cette propriété
}

const OngletAjoutUtilisateur: React.FC<OngletAjoutUtilisateurProps> = ({
  formData,
  selectOptions,
  selectOpenStates,
  existenceMessages,
  dernierUtilisateur,
  onChange,
  onSelectToggle,
  onSubmit,
  DynamicFormComponent
}) => {
  // Ajouter une vérification avant de rendre le formulaire
  if (!formData || Object.keys(formData).length === 0) {
    return (
      <div className="form-loading">
        <div className="form-loading__spinner"></div>
        <p>Initialisation du formulaire...</p>
      </div>
    );
  }

  return (
    <div className="add-user-page">
      <div className="add-user-header">
        <Title headingLevel="h3" className="add-user-title">
          Créer un nouvel utilisateur
        </Title>
        <p className="add-user-subtitle">
          Remplissez les informations ci-dessous pour ajouter un nouvel utilisateur au système. 
          Les champs marqués d'un astérisque (*) sont obligatoires.
        </p>
      </div>

      <div className="add-user-content">
        <div className="add-user-form-wrapper">
          <GenericForm
            formData={formData}
            selectOptions={selectOptions}
            selectOpenStates={selectOpenStates}
            onChange={onChange}
            onSelectToggle={onSelectToggle}
            onSubmit={onSubmit}
            existenceMessages={existenceMessages}
          />
          {DynamicFormComponent}
        </div>
      </div>
    </div>
  );
};

export default OngletAjoutUtilisateur;
