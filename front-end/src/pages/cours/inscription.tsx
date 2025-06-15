import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import type { CoursData, DataReservation } from '@clubmanager/types';
import ModalSize from '../../components/modal'; // ajuste selon ton arborescence
import { useNavigate } from 'react-router-dom';
import {
  Page,
  PageSection,
  Title,
  Button,
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem
} from '@patternfly/react-core';

function convertToNumber(value: any): number | null {
  const parsedValue = Number(value);
  return isNaN(parsedValue) ? null : parsedValue;
}

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

interface UserData {
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  abonnement_id: number;
  grade_id: number;
  status_id: number;
  date_naissance: string;
}

const Inscription = () => {
  const [cours, setCours] = useState<CoursData[]>([]);
  const [reservations, setReservations] = useState<number[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/cours');
        if (!response.ok) throw new Error('Erreur lors de la récupération des cours');
        const data: CoursData[] = await response.json();
        setCours(data);
      } catch (err) {
        console.error(err);
      }
    };

    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.data?.nom && parsed?.data?.prenom) {
          setUserData(parsed.data);
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
  }, []);

  const showParticipants = async (coursId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/cours/${coursId}/`);
      if (!response.ok) throw new Error('Erreur récupération participants');
      const cours = await response.json();
      navigate(`/pages/cours/participants`, { state: { cours } });
    } catch (err) {
      alert("Impossible de récupérer les participants.");
    }
  };

  const toggleReservation = async (coursItem: CoursData, isReserved: boolean) => {
    const coursId = convertToNumber(coursItem.id);
    if (coursId === null || !userData) return;

    const dataToSend: DataReservation = {
      cours_id: coursId,
      utilisateur_nom: userData.nom,
      utilisateur_prenom: userData.prenom,
    };

    try {
      const url = isReserved
        ? "http://localhost:3000/cours/annulation"
        : "http://localhost:3000/cours/inscription";

      const method = isReserved ? "DELETE" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        const message = isReserved
          ? "Vous avez annulé votre réservation."
          : `Inscription réussie pour le ${formatDateFromISO(coursItem.date_cours)}`;
        setModalMessage(message);
        setReservations((prev) =>
          isReserved ? prev.filter((id) => id !== coursId) : [...prev, coursId]
        );
      } else {
        setModalMessage(result.message || "Erreur inconnue.");
      }

      setShowModal(true);
    } catch (error) {
      console.error("Erreur API :", error);
    }
  };

  return (
    <Provider store={store}>
      <Page>
        <PageSection>
          <Title headingLevel="h1">Liste des Cours</Title>
          {cours.map((coursItem) => {
            const isReserved = coursItem.utilisateurs?.some(
              (u) => u.nom === userData?.nom && u.prenom === userData?.prenom
            );

            return (
              <Card key={coursItem.id} className="mb-4" isFlat>
                <CardTitle>
                  {new Date(coursItem.date_cours).toLocaleDateString()} - {coursItem.type_cours}
                </CardTitle>
                <CardBody>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem>
                      <strong>Début:</strong> {coursItem.heure_debut} &nbsp;
                      <strong>Fin:</strong> {coursItem.heure_fin}
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant={isReserved ? "danger" : "primary"}
                        onClick={() => toggleReservation(coursItem, isReserved)}
                      >
                        {isReserved ? "Annuler" : "Réserver"}
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="link"
                        onClick={() => showParticipants(coursItem.id)}
                      >
                        Voir les participants
                      </Button>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            );
          })}
        </PageSection>
        <ModalSize
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Notification"
        >
          {modalMessage}
        </ModalSize>
      </Page>
    </Provider>
  );
};

export default Inscription;
