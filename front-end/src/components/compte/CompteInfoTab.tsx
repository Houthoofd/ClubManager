import React from 'react';
import {
  Button,
  Spinner,
} from '@patternfly/react-core';
import FormulaireCompte from './FormulaireCompte';

interface CompteInfoTabProps {
  isDataReady: boolean;
  compteInfo: any;
  form: any;
  password: string;
  showPasswordField: boolean;
  editingFields: { [key: string]: boolean };
  abonnements: any[];
  grades: any[];
  status: any[];
  genres: any[];
  onEditClick: (field: string) => void;
  onEmailChange: (value: string) => void;
  onFormChange: (field: string, value: string) => void;
  onPasswordChange: (value: string) => void;
  onApplyChanges: () => void;
  isLoading: boolean;
  formatDateForInput: (date: string) => string;
  disabledFields: { [key: string]: boolean };
  canEditStatus: boolean; // AJOUTÉ: Prop manquante
}

const CompteInfoTab: React.FC<CompteInfoTabProps> = ({
  isDataReady,
  compteInfo,
  form,
  password,
  showPasswordField,
  editingFields,
  abonnements,
  grades,
  status,
  genres,
  onEditClick,
  onEmailChange,
  onFormChange,
  onPasswordChange,
  onApplyChanges,
  isLoading,
  formatDateForInput,
  disabledFields,
  canEditStatus, // AJOUTÉ: Destructuring de la prop
}) => {
  if (!isDataReady) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="compte-info-tab">
      <div className="compte-info-content">
        <FormulaireCompte
          compteInfo={compteInfo}
          form={form}
          password={password}
          editingFields={editingFields}
          onEditClick={onEditClick}
          onEmailChange={onEmailChange}
          onFormChange={onFormChange}
          onPasswordChange={onPasswordChange}
          abonnements={abonnements}
          grades={grades}
          status={status}
          genres={genres}
          formatDateForInput={formatDateForInput}
          disabledFields={disabledFields}
          canEditStatus={canEditStatus} // AJOUTÉ: Transmission de la prop
          includePassword={true}
        />

        {/* Bouton "Voir les changements effectués" aligné complètement à droite avec border-radius */}
        {Object.values(editingFields).some(Boolean) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '1.5rem',
              width: '100%',
            }}
          >
            <Button
              variant="primary"
              onClick={onApplyChanges}
              isLoading={isLoading}
              isDisabled={isLoading}
              style={{
                backgroundColor: '#007bff',
                borderColor: '#007bff',
                color: '#fff',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                borderRadius: '8px', // Ajout du border-radius pour respecter le style de l'app
              }}
            >
              {isLoading ? 'Sauvegarde...' : 'Voir les changements effectués'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompteInfoTab;

