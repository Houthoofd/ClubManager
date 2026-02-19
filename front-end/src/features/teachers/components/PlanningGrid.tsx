import React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  Title,
} from '@patternfly/react-core';
import { CalendarAltIcon } from '@patternfly/react-icons';
import { PlanningCoursProfesseur } from '@clubmanager/types';
import CoursCard from './CoursCard';

interface PlanningGridProps {
  cours: PlanningCoursProfesseur[];
  filtreJour: string;
}

const PlanningGrid: React.FC<PlanningGridProps> = ({
  cours,
  filtreJour
}) => {
  if (cours.length === 0) {
    return (
      <EmptyState>
        <CalendarAltIcon size="xl" />
        <Title headingLevel="h4" size="lg">
          Aucun cours trouvé
        </Title>
        <EmptyStateBody>
          {filtreJour === 'tous' 
            ? 'Vous n\'avez aucun cours assigné pour le moment'
            : `Aucun cours le ${filtreJour}`
          }
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <div className="courses-grid" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
      gap: '1rem',
      marginTop: '1rem'
    }}>
      {cours.map((coursItem) => (
        <CoursCard
          key={coursItem.cours_recurrent_id}
          cours={coursItem}
        />
      ))}
    </div>
  );
};

export default PlanningGrid;
