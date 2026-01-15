import React from 'react';
import { FormSelectOption, Card, CardBody, CardTitle } from '@patternfly/react-core';

// Composant ChipGroup personnalisé
const ChipGroup: React.FC<{ categoryName?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ categoryName, style, children }) => (
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    background: '#f6f6f6',
    borderRadius: 8,
    padding: '8px 12px',
    ...style
  }}>
    {categoryName && <span style={{ fontWeight: 500, marginRight: 8 }}>{categoryName}:</span>}
    {children}
  </div>
);

// Composant Chip personnalisé
const Chip: React.FC<{ onClickClose?: () => void; className?: string; children: React.ReactNode }> = ({ onClickClose, className, children }) => (
  <span
    className={className || ''}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: '#e2e2e2',
      borderRadius: 16,
      padding: '0 10px',
      fontSize: 14,
      marginRight: 4,
      marginBottom: 4,
      height: 28,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
    }}
  >
    {children}
    {onClickClose && (
      <button
        type="button"
        onClick={onClickClose}
        style={{
          background: 'none',
          border: 'none',
          marginLeft: 6,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 16,
          lineHeight: 1,
          color: '#6c757d'
        }}
        aria-label="Retirer"
      >
        ×
      </button>
    )}
  </span>
);

interface SelectAllUsersProps {
  utilisateurs: any[];
  selectedUsers: string[];
  onSelectAll: () => void;
  onUserSelect: (selected: string[]) => void;
}

const SelectAllUsers: React.FC<SelectAllUsersProps> = ({
  utilisateurs,
  selectedUsers,
  onSelectAll, // ne sera plus utilisé
  onUserSelect
}) => {
  // Utilise un <select multiple> natif pour permettre la sélection multiple avec Ctrl/Cmd/Shift
  return (
    <Card className="modern-card" style={{ marginBottom: 24 }}>
      <CardTitle style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>
        Sélection des utilisateurs à promouvoir
      </CardTitle>
      <CardBody>
        <label htmlFor="multi-user-select" style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
          Sélectionner un ou plusieurs utilisateurs (Ctrl/Cmd ou Shift + clic)
        </label>
        <select
          id="multi-user-select"
          multiple
          value={selectedUsers}
          onChange={e => {
            const options = e.target.options;
            const values: string[] = [];
            for (let i = 0; i < options.length; i++) {
              if (options[i].selected && options[i].value !== '') {
                values.push(options[i].value);
              }
            }
            onUserSelect(values);
          }}
          style={{
            width: '100%',
            minHeight: 120,
            marginBottom: 12,
            borderRadius: 6,
            border: '1px solid #d2d2d2',
            padding: 8,
            fontSize: 15,
            background: '#fff'
          }}
          className="modern-select"
        >
          <option value="" disabled>
            Sélectionner un ou plusieurs utilisateurs
          </option>
          {utilisateurs.map(user => (
            <option key={user.id} value={String(user.id)}>
              {user.first_name} {user.last_name} ({user.email})
            </option>
          ))}
        </select>
        {/* Affichage des utilisateurs sélectionnés sous forme de pill */}
        {selectedUsers.length > 0 && (
          <ChipGroup categoryName="Utilisateurs sélectionnés" style={{ marginTop: 8 }}>
            {utilisateurs
              .filter(u => selectedUsers.includes(String(u.id)))
              .map(u => (
                <Chip
                  key={u.id}
                  onClickClose={() => onUserSelect(selectedUsers.filter(id => id !== String(u.id)))}
                  className="modern-chip"
                >
                  {u.first_name} {u.last_name}
                </Chip>
              ))}
          </ChipGroup>
        )}
      </CardBody>
    </Card>
  );
};

export default SelectAllUsers;
