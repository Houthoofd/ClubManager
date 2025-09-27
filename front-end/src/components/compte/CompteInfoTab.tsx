import React from 'react';
import { Spinner } from '@patternfly/react-core';
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
}) => {
  if (!isDataReady) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <FormulaireCompte
      compteInfo={compteInfo}
      form={form}
      password={password}
      showPasswordField={showPasswordField}
      editingFields={editingFields}
      abonnements={abonnements}
      grades={grades}
      status={status}
      genres={genres}
      onEditClick={onEditClick}
      onEmailChange={onEmailChange}
      onFormChange={onFormChange}
      onPasswordChange={onPasswordChange}
      onApplyChanges={onApplyChanges}
      isLoading={isLoading}
      formatDateForInput={formatDateForInput}
      disabledFields={disabledFields}
    />
  );
};

export default CompteInfoTab;
