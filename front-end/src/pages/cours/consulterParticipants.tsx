import { Provider } from 'react-redux';
import store from '../../redux/store';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Button,
  Label,
  Spinner,
  Alert
} from '@patternfly/react-core';
import { CheckCircleIcon, TimesCircleIcon } from '@patternfly/react-icons';
import { useParticipants} from '../../hooks/useParticipants';
import { useAnnulerPresence, useValiderPresence } from '../../hooks/useCours';
import ModalSize from '../../components/modal';
import { useState } from 'react';

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ParticipantsPage = () => {
  const { id } = useParams();
  const coursId = Number(id);

  // Utilisation des hooks React Query
  const { data: cours, isLoading, error } = useParticipants(coursId);
  const annulerPresence = useAnnulerPresence();
  const validerPresence = useValiderPresence();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  const handleStatus = async (utilisateur: any, action: 'valider' | 'annuler') => {
    try {
      const data = {
        cours_id: coursId,
        utilisateur_nom: utilisateur.nom,
        utilisateur_prenom: utilisateur.prenom
      };
      if (action === 'valider') {
        await validerPresence.mutateAsync(data);
        setModalMessage('Présence validée !');
      } else {
        await annulerPresence.mutateAsync(data);
        setModalMessage('Présence annulée !');
      }
      setShowModal(true);
    } catch (err) {
      setModalMessage("Erreur lors de la mise à jour de la présence.");
      setShowModal(true);
      console.error('Erreur lors de la mise à jour de la présence:', err);
    }
  };

  if (isLoading) {
    return <Spinner size="xl" />;
  }

  if (error) {
    return <Alert variant="danger" title="Erreur lors du chargement des participants" />;
  }

  if (!cours) {
    return <Alert variant="warning" title="Cours introuvable" />;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <Card>
        <CardTitle>
          Cours du {cours.date_cours ? formatDateFromISO(cours.date_cours) : 'Inconnu'}
        </CardTitle>
        <CardBody>
          <p>Nombre de participants : {cours.utilisateurs?.length || 0}</p>
        </CardBody>
      </Card>

      <div style={{ marginTop: '1rem' }}>
        {cours.utilisateurs?.map((utilisateur:any, idx:any) => {
          const presence = utilisateur.presence;
          let presenceColor = 'grey';
          if (presence === 1) presenceColor = 'green';
          else if (presence === 0) presenceColor = 'red';

          return (
            <Card key={utilisateur.id ? utilisateur.id : idx} style={{ marginBottom: '0.5rem' }}>
              <CardBody>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <Label color="blue">{utilisateur.nom} {utilisateur.prenom}</Label>
                  </FlexItem>
                  <FlexItem>
                    {presence !== null && (
                      <Label color={presenceColor as any}>
                        {presence === 1 ? 'Présent' : 'Absent'}
                      </Label>
                    )}
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="plain"
                      aria-label="Valider présence"
                      onClick={() => handleStatus(utilisateur, 'valider')}
                    >
                      <CheckCircleIcon color="green" />
                    </Button>
                    <Button
                      variant="plain"
                      aria-label="Annuler présence"
                      onClick={() => handleStatus(utilisateur, 'annuler')}
                    >
                      <TimesCircleIcon color="red" />
                    </Button>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <ModalSize
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Notification"
      >
        {modalMessage}
      </ModalSize>
    </div>
  );
};

const Participants = () => {
  return (
    <Provider store={store}>
      <ParticipantsPage />
    </Provider>
  );
};


export default Participants;
