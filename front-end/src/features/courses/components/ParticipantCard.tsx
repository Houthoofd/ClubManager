import React from 'react';
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  Button,
} from '@patternfly/react-core';
import { CheckCircleIcon, TimesCircleIcon } from '@/shared/icons';

interface ParticipantCardProps {
  utilisateur: {
    id?: number;
    nom: string;
    prenom: string;
    presence: number | null;
  };
  onValidatePresence: () => void;
  onCancelPresence: () => void;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  utilisateur,
  onValidatePresence,
  onCancelPresence
}) => {
  const getStatusClass = (presence: number | null) => {
    if (presence === 1) return 'participant-status participant-status-present';
    if (presence === 0) return 'participant-status participant-status-absent';
    return 'participant-status participant-status-unknown';
  };

  const getStatusText = (presence: number | null) => {
    if (presence === 1) return 'Présent';
    if (presence === 0) return 'Absent';
    return 'Non défini';
  };

  return (
    <Card className="participant-card">
      <CardBody>
        <Flex 
          justifyContent={{ default: 'justifyContentSpaceBetween' }} 
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <div className="participant-name">
              {utilisateur.prenom} {utilisateur.nom}
            </div>
          </FlexItem>
          
          <FlexItem>
            <div className={getStatusClass(utilisateur.presence)}>
              {getStatusText(utilisateur.presence)}
            </div>
          </FlexItem>
          
          <FlexItem>
            <div className="participant-actions">
              <Button
                variant="plain"
                className="participant-action-button participant-action-validate"
                onClick={onValidatePresence}
                aria-label="Valider présence"
              >
                <CheckCircleIcon />
              </Button>
              <Button
                variant="plain"
                className="participant-action-button participant-action-cancel"
                onClick={onCancelPresence}
                aria-label="Annuler présence"
              >
                <TimesCircleIcon />
              </Button>
            </div>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default ParticipantCard;
