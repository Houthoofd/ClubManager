import React from 'react';
import { Title } from '@patternfly/react-core';
import ProfesseurCard from './ProfesseurCard';

interface ProfesseursListProps {
  professeurs: any[];
  onRemoveProfesseur: (professeur: any) => void;
}

const ProfesseursList: React.FC<ProfesseursListProps> = ({
  professeurs,
  onRemoveProfesseur
}) => {
  if (professeurs.length === 0) {
    return (
      <div className="professeur-empty-state">
        <Title headingLevel="h3" style={{ color: '#6c757d', marginBottom: '1rem' }}>
          Aucun professeur enregistré
        </Title>
        <p>
          Il n'y a actuellement aucun professeur dans le système.
        </p>
      </div>
    );
  }

  return (
    <div className="professeur-cards-grid">
      {professeurs.map((prof) => (
        <ProfesseurCard
          key={prof.id}
          professeur={prof}
          onRemove={() => onRemoveProfesseur(prof)}
        />
      ))}
    </div>
  );
};

export default ProfesseursList;
