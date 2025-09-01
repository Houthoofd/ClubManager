import { useState } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import ModalSize from '../../components/modal';
import {
  Page,
  PageSection,
  Title,
  Button,
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Spinner,
  Alert
} from '@patternfly/react-core';
import { useCoursDisponibles, useReservationsUtilisateur, useInscrireUtilisateurCours, useAnnulerInscription } from '../../hooks/useInscriptions';

interface CoursData {
  id: number;
  nom: string;
  jour: string;
  heure_debut: string;
  heure_fin: string;
}

const Inscription = () => {
  const [userData] = useState(() => {
    const storedData = localStorage.getItem('userData');
    return storedData ? JSON.parse(storedData).data : null;
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  // Utilisation des hooks React Query
  const { data: cours = [], isLoading: loadingCours, error: errorCours } = useCoursDisponibles();
  const { data: reservations = [], isLoading: loadingReservations, error: errorReservations } = useReservationsUtilisateur(userData?.id);
  const inscrireUtilisateur = useInscrireUtilisateurCours();
  const annulerInscription = useAnnulerInscription();

  const handleInscription = async (coursId: number) => {
    try {
      await inscrireUtilisateur.mutateAsync({ userId: userData.id, coursId });
      setModalMessage('Inscription réussie !');
      setShowModal(true);
    } catch (error) {
      console.error('Erreur lors de l\'inscription au cours:', error);
      setModalMessage('Erreur lors de l\'inscription.');
      setShowModal(true);
    }
  };

  const handleAnnulation = async (coursId: number) => {
    try {
      await annulerInscription.mutateAsync({ userId: userData.id, coursId });
      setModalMessage('Inscription annulée.');
      setShowModal(true);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'inscription:', error);
      setModalMessage('Erreur lors de l\'annulation.');
      setShowModal(true);
    }
  };

  if (loadingCours || loadingReservations) {
    return <Spinner size="xl" />;
  }

  if (errorCours || errorReservations) {
    return <Alert variant="danger" title="Erreur lors du chargement des données." />;
  }

  return (
    <Provider store={store}>
      <Page>
        <PageSection>
          <Title headingLevel="h1">Inscriptions aux cours</Title>
          <div style={{ marginTop: '1rem' }}>
            {cours.map((c: CoursData) => (
              <Card key={c.id} style={{ marginBottom: '1rem' }}>
                <CardTitle>{c.nom}</CardTitle>
                <CardBody>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem>
                      <p>{c.jour} - {c.heure_debut} à {c.heure_fin}</p>
                    </FlexItem>
                    <FlexItem>
                      {reservations.includes(c.id) ? (
                        <Button variant="danger" onClick={() => handleAnnulation(c.id)}>
                          Annuler l'inscription
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => handleInscription(c.id)}>
                          S'inscrire
                        </Button>
                      )}
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </div>
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

