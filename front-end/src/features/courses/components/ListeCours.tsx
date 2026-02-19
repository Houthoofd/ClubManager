import React from 'react';
import { EmptyState, EmptyStateBody, Gallery, GalleryItem, Title } from '@patternfly/react-core';
import CarteCours from './CarteCours';

interface ListeCoursProps {
  cours: any[];
  onModifierCours: (cours: any) => void;
  onSupprimerCours: (cours: any) => void;
  onDissocierProfesseur: (cours: any, prof: string) => void;
  titre?: string;
  messageVide?: string;
}

const ListeCours: React.FC<ListeCoursProps> = ({
  cours,
  onModifierCours,
  onSupprimerCours,
  onDissocierProfesseur,
  titre = "Planning des cours",
  messageVide = "Aucun cours enregistré."
}) => {
  if (cours.length === 0) {
    return (
      <EmptyState>
        <EmptyStateBody>{messageVide}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
        {titre}
      </Title>
      <Gallery hasGutter maxWidths={{ default: '350px' }}>
        {cours.map((c, index) => (
          <GalleryItem key={c.id || index}>
            <CarteCours
              cours={c}
              onModifier={onModifierCours}
              onSupprimer={onSupprimerCours}
              onDissocierProfesseur={onDissocierProfesseur}
            />
          </GalleryItem>
        ))}
      </Gallery>
    </>
  );
};

export default ListeCours;
