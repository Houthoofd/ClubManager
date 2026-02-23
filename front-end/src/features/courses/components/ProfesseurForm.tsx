import React, { useState } from 'react';
import {
  FormSelect,
  FormSelectOption,
  Button,
  DualListSelector,
} from '@patternfly/react-core';
import { UserPlusIcon } from '@/shared/icons';

interface ProfesseurFormProps {
  utilisateurs: any[];
  onSubmit: (selectedUsers: any[], typeId: string) => void;
  isLoading?: boolean;
  message?: string;
  messageType?: 'success' | 'error';
}

const ProfesseurForm: React.FC<ProfesseurFormProps> = ({
  utilisateurs,
  onSubmit,
  isLoading = false,
  message,
  messageType
}) => {
  const [typeId, setTypeId] = useState<string>('');
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [chosenOptions, setChosenOptions] = useState<string[]>([]);

  // Initialiser les options disponibles
  React.useEffect(() => {
    const userOptions = utilisateurs.map((user: any) => 
      `${user.first_name} ${user.last_name}`
    );
    setAvailableOptions(userOptions);
  }, [utilisateurs]);

  const onListChange = (
    newAvailableOptions: React.ReactNode[],
    newChosenOptions: React.ReactNode[]
  ) => {
    setAvailableOptions(newAvailableOptions as string[]);
    setChosenOptions(newChosenOptions as string[]);
  };

  const handleSubmit = () => {
    if (chosenOptions.length === 0 || !typeId) {
      return;
    }

    // Convertir les noms sélectionnés en objets utilisateur
    const selectedUsers = chosenOptions.map(userName => {
      const user = utilisateurs.find(u => 
        `${u.first_name} ${u.last_name}` === userName
      );
      return {
        id: user?.id,
        nom: user?.last_name,
        prenom: user?.first_name
      };
    }).filter(user => user.id);

    onSubmit(selectedUsers, typeId);
    setChosenOptions([]);
    setTypeId('');
    
    // Réinitialiser les options
    const userOptions = utilisateurs.map((user: any) => 
      `${user.first_name} ${user.last_name}`
    );
    setAvailableOptions(userOptions);
  };

  return (
    <div className="professeur-form-container">
      {message && (
        <div className={messageType === 'success' ? 'professeur-success-message' : 'professeur-error-message'}>
          {message}
        </div>
      )}

      <div className="professeur-form-field">
        <label className="professeur-form-label">
          Type de cours :
        </label>
        <FormSelect
          value={typeId}
          onChange={(_event, value) => setTypeId(value)}
          aria-label="Type de cours"
          className="form-field"
        >
          <FormSelectOption isDisabled value="" label="Sélectionnez un type" />
          <FormSelectOption value="Judo" label="Judo" />
          <FormSelectOption value="JJB" label="JJB" />
          <FormSelectOption value="Grappling" label="Grappling" />
        </FormSelect>
      </div>

      <div className="professeur-form-field">
        <label className="professeur-form-label">
          Sélectionnez les utilisateurs :
        </label>
        <DualListSelector
          availableOptions={availableOptions}
          chosenOptions={chosenOptions}
          onListChange={onListChange}
          availableOptionsTitle="Utilisateurs disponibles"
          chosenOptionsTitle="Professeurs sélectionnés"
          addAllTooltip="Ajouter tous"
          addSelectedTooltip="Ajouter sélectionnés"
          removeSelectedTooltip="Retirer sélectionnés"
          removeAllTooltip="Retirer tous"
          filterInputLabel="Rechercher..."
          filterClearLabel="Effacer"
          id="professeur-dual-list-selector"
        />
      </div>

      <div className="professeur-submit-section">
        <Button
          variant="primary"
          icon={<UserPlusIcon />}
          onClick={handleSubmit}
          isDisabled={chosenOptions.length === 0 || !typeId || isLoading}
          isLoading={isLoading}
        >
          Ajouter les professeurs
        </Button>
      </div>
    </div>
  );
};

export default ProfesseurForm;
