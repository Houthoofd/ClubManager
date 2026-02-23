import React from 'react';
import {
  Card,
  CardBody,
  Button,
  FormSelect,
  FormSelectOption,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import { PlusIcon } from '@/shared/icons';

interface PlanningFilterProps {
  filtreJour: string;
  onFilterSelect: (selection: string) => void;
}

const joursWeek = [
  { value: 'tous', label: 'Tous les jours' },
  { value: 'Lundi', label: 'Lundi' },
  { value: 'Mardi', label: 'Mardi' },
  { value: 'Mercredi', label: "Mercredi" },
  { value: 'Jeudi', label: 'Jeudi' },
  { value: 'Vendredi', label: 'Vendredi' },
  { value: 'Samedi', label: 'Samedi' },
  { value: 'Dimanche', label: 'Dimanche' }
];

const PlanningFilter: React.FC<PlanningFilterProps> = ({
  filtreJour,
  onFilterSelect
}) => {
  const onChange = (_event: React.FormEvent<HTMLSelectElement>, value: string) => {
    onFilterSelect(value);
  };

  return (
    <Card className="filter-card">
      <CardBody>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <Label>Filtrer par jour :</Label>
          </FlexItem>
          <FlexItem>
            <FormSelect 
              value={filtreJour} 
              onChange={onChange} 
              aria-label="Filtrer par jour"
              style={{ width: '200px' }}
            >
              {joursWeek.map((jour, index) => (
                <FormSelectOption 
                  key={index} 
                  value={jour.value} 
                  label={jour.label} 
                />
              ))}
            </FormSelect>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default PlanningFilter;
