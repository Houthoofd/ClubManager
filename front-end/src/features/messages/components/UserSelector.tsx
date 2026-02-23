import React from 'react';
import {
  FormGroup,
  FormSelect,
  FormSelectOption,
  Badge,
  Button
} from '@patternfly/react-core';
import { UserIcon, TimesIcon } from '@/shared/icons';

interface UserSelectorProps {
  utilisateurs: any[];
  selectedUsers: number[];
  onUserSelect: (userId: number) => void;
  onUserRemove: (userId: number) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  utilisateurs,
  selectedUsers,
  onUserSelect,
  onUserRemove
}) => {
  return (
    <FormGroup 
      label="Destinataires" 
      isRequired 
      fieldId="user-select" 
      className="modern-form-group"
    >
      <div className="user-selection-container">
        <FormSelect
          value=""
          onChange={(e) => {
            const userId = Number(e.currentTarget.value);
            if (userId && !selectedUsers.includes(userId)) {
              onUserSelect(userId);
            }
          }}
          aria-label="Sélectionner un utilisateur"
          className="user-select"
        >
          <FormSelectOption value="" label="Sélectionner un utilisateur..." />
          {utilisateurs
            .filter(user => !selectedUsers.includes(user.id))
            .map((user) => (
              <FormSelectOption
                key={user.id}
                value={user.id.toString()}
                label={`${user.first_name} ${user.last_name}`}
              />
            ))}
        </FormSelect>
      </div>

      {selectedUsers.length > 0 && (
        <div className="selected-users">
          <small className="selected-users-label">
            <UserIcon style={{ marginRight: '8px' }} />
            {selectedUsers.length} utilisateur(s) sélectionné(s) :
          </small>
          <div className="user-badges">
            {selectedUsers.map((userId) => {
              const user = utilisateurs.find((u) => u.id === userId);
              return (
                user && (
                  <Badge key={user.id} className="user-badge">
                    {user.first_name} {user.last_name}
                    <Button
                      variant="plain"
                      aria-label="Retirer utilisateur"
                      onClick={() => onUserRemove(user.id)}
                      className="remove-user-btn"
                    >
                      <TimesIcon />
                    </Button>
                  </Badge>
                )
              );
            })}
          </div>
        </div>
      )}
    </FormGroup>
  );
};

export default UserSelector;
