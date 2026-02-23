import React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Button,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import { CalendarAltIcon, ClockIcon, UserIcon, EditIcon, TrashIcon } from '@/shared/icons';
import { PlanningCoursProfesseur } from '@clubmanager/types';

interface CoursCardProps {
  cours: PlanningCoursProfesseur;
}

// Fonction utilitaire pour convertir le jour semaine en nom
const convertirJourSemaine = (jour: number | string): string => {
  if (typeof jour === 'string') return jour;
  
  // Mapping correct : 1 = Lundi, 2 = Mardi, ..., 7 = Dimanche
  const jours = {
    1: 'Lundi',
    2: 'Mardi', 
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    7: 'Dimanche'
  };
  
  return jours[jour as keyof typeof jours] || 'Inconnu';
};

// Fonction utilitaire pour formater l'heure (retirer les secondes)
const formaterHeure = (heure: string): string => {
  return heure.substring(0, 5); // HH:MM:SS -> HH:MM
};

const CoursCard: React.FC<CoursCardProps> = ({ cours }) => {
  const jourFormate = convertirJourSemaine(cours.jour_semaine);
  const couleurLabel = cours.est_recurrent_actif ? 'green' : 'grey';
  
  return (
    <Card className="course-card" isHoverable>
      <CardTitle>
        <FlexItem>
          <Label color={couleurLabel}>{cours.type_cours}</Label>
        </FlexItem>
      </CardTitle>
      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <CalendarAltIcon />
              <span>{jourFormate}</span>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <ClockIcon />
              <span>{formaterHeure(cours.heure_debut)} - {formaterHeure(cours.heure_fin)}</span>
            </Flex>
          </FlexItem>
          <FlexItem style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0' }}>
            <small style={{ color: '#6a6e73' }}>
              Professeur: {cours.professeur_prenom} {cours.professeur_nom}
            </small>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default CoursCard;
