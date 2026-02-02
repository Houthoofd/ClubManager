import React from 'react';
import { Title } from '@patternfly/react-core';
import CoursCard from './CoursCard';

interface CoursListProps {
  cours: any[];
  onModifierCours: (cours: any) => void;
  onSupprimerCours: (cours: any) => void;
  onDissocierProfesseur: (cours: any, prof: string) => void;
}

const CoursList: React.FC<CoursListProps> = ({
  cours,
  onModifierCours,
  onSupprimerCours,
  onDissocierProfesseur
}) => {
  if (cours.length === 0) {
    return (
      <div className="cours-empty-state">
        <Title headingLevel="h3" style={{ color: '#6c757d', marginBottom: '1rem' }}>
          Aucun cours planifié
        </Title>
        <p>
          Il n'y a actuellement aucun cours dans le planning.
        </p>
      </div>
    );
  }

  const handleDissocierProfesseur = (professeur: string, cours: any) => {
    console.log('🎯 Dissociation avec contexte complet:', {
      professeur,
      cours: {
        jour: cours.jour,
        type_cours: cours.type_cours,
        heure_debut: cours.heure_debut,
        heure_fin: cours.heure_fin
      }
    });

    onDissocierProfesseur({
      prof: { name: professeur },
      cours: {
        jour_semaine: cours.jour,
        jour: cours.jour,
        type_cours: cours.type_cours,
        heure_debut: cours.heure_debut,
        heure_fin: cours.heure_fin
      }
    });
  };

  return (
    <div className="cours-cards-grid">
      {cours.map((c, index) => (
        <CoursCard
          key={index}
          cours={c}
          onModifier={() => onModifierCours(c)}
          onSupprimer={() => onSupprimerCours(c)}
          onDissocierProfesseur={(prof) => handleDissocierProfesseur(prof, c)}
        />
      ))}
    </div>
  );
};

export default CoursList;
