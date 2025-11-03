import React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import { PlanningCoursProfesseur } from '@clubmanager/types';

interface PlanningStatisticsProps {
  cours: PlanningCoursProfesseur[];
}

const PlanningStatistics: React.FC<PlanningStatisticsProps> = ({ cours }) => {
  const coursActifs = cours.filter(c => c.est_recurrent_actif).length;
  const coursInactifs = cours.filter(c => !c.est_recurrent_actif).length;

  return (
    <Card>
      <CardTitle>Statistiques de vos cours</CardTitle>
      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <Label>Total de cours :</Label>
              <Label color="blue">{cours.length}</Label>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <Label>Cours actifs :</Label>
              <Label color="green">{coursActifs}</Label>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <Label>Cours inactifs :</Label>
              <Label color="grey">{coursInactifs}</Label>
            </Flex>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default PlanningStatistics;
