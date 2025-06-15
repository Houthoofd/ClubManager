import React, { useState, useEffect } from 'react';
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
  Label
} from '@patternfly/react-core';
import { CheckCircleIcon, TimesCircleIcon } from '@patternfly/react-icons';
import type { CoursData, DataAnnulation, Utilisateur } from '@clubmanager/types';

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

  console.log(id)

  const [cours, setCours] = useState<CoursData | null>(null);
  const [participants, setParticipants] = useState<Utilisateur[]>([]);

  useEffect(() => {
    if (!coursId) return;

    const fetchCours = async () => {
      try {
        const response = await fetch(`http://localhost:3000/cours/${coursId}`);
        if (!response.ok) throw new Error("Erreur lors du chargement du cours");

        const data: CoursData = await response.json();
        setCours(data.Cours);
        setParticipants(data.Cours.utilisateurs || []);
      } catch (error) {
        console.error("Erreur fetch cours:", error);
      }
    };

    fetchCours();
  }, [coursId]);

  const handleStatus = async (data: Record<string, string>, status: string) => {
    if (!cours?.id) return;

    const dataToSend: DataAnnulation = {
      cours_id: cours.id,
      utilisateur_nom: data.nom,
      utilisateur_prenom: data.prenom
    };
    console.log(dataToSend)
    const endpoint = status === "annuler"
      ? "http://localhost:3000/cours/inscription/annulation"
      : "http://localhost:3000/cours/inscription/validation";

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setParticipants((prev) =>
          prev.map((u) =>
            u.nom === data.nom && u.prenom === data.prenom
              ? { ...u, presence: status === "valider" ? 1 : 0 }
              : u
          )
        );
      } else {
        console.error("Erreur de mise à jour");
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (!cours) {
    return <p>Chargement en cours...</p>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <Card>
        <CardTitle>
          Cours du {cours.date_cours ? formatDateFromISO(cours.date_cours) : 'Inconnu'}
        </CardTitle>
        <CardBody>
          <p>Nombre de participants : {cours.utilisateurs?.length}</p>
        </CardBody>
      </Card>

      <div style={{ marginTop: '1rem' }}>
        {participants.map((utilisateur) => {
          const presence = utilisateur.presence;
          let presenceColor = 'grey';
          if (presence === 1) presenceColor = 'green';
          else if (presence === 0) presenceColor = 'red';

          return (
            <Card key={utilisateur.id} style={{ marginBottom: '0.5rem' }}>
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
                      onClick={() => handleStatus({ nom: utilisateur.nom, prenom: utilisateur.prenom }, 'valider')}
                    >
                      <CheckCircleIcon color="green" />
                    </Button>
                    <Button
                      variant="plain"
                      aria-label="Annuler présence"
                      onClick={() => handleStatus({ nom: utilisateur.nom, prenom: utilisateur.prenom }, 'annuler')}
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
