import React from 'react';
import { Button } from '@patternfly/react-core';
import { TimesCircleIcon } from '@patternfly/react-icons';

interface ProfesseurCardProps {
  professeur: {
    id: number;
    first_name: string;
    last_name: string;
  };
  onRemove: () => void;
}

const ProfesseurCard: React.FC<ProfesseurCardProps> = ({
  professeur,
  onRemove
}) => {
  return (
    <div className="professeur-card">
      <div className="professeur-card-name">
        {professeur.first_name} {professeur.last_name}
      </div>
      
      <div className="professeur-card-actions">
        <Button
          variant="plain"
          className="professeur-action-button"
          onClick={onRemove}
          aria-label="Retirer la promotion"
        >
          <TimesCircleIcon />
        </Button>
      </div>
    </div>
  );
};

export default ProfesseurCard;
