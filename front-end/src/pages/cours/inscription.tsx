import { useState } from 'react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { useCours, useCoursPlanning, useCoursInscritsUtilisateur } from '../../hooks/useCours';
import { useUtilisateursPourTousLesCours, useInscrireUtilisateurReservation, useAnnulerInscriptionParNomPrenom } from '../../hooks/useInscriptions';
import { datareservationSchema } from '@clubmanager/types';

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
  const navigate = useNavigate();

  // Utilisation des hooks React Query
  const { data: cours = [], isLoading: loadingCours, error: errorCours } = useCours();
  const { data: planning = [], isLoading: loadingPlanning, error: errorPlanning } = useCoursPlanning();
  const { data: coursInscrits = [] } = useCoursInscritsUtilisateur(userData?.id);
  console.log('Cours inscrits utilisateur:', coursInscrits);
  const inscrireUtilisateur = useInscrireUtilisateurReservation();
  const annulerInscription = useAnnulerInscriptionParNomPrenom();

  // Hook pour afficher les utilisateurs inscrits à tous les cours
  const utilisateursCoursQueries = useUtilisateursPourTousLesCours(cours);
  // Affiche le contenu de chaque query pour debug
  utilisateursCoursQueries.forEach((q, idx) => {
    console.log(`Cours idx ${idx} :`, q.data);
  });

  console.log(userData.id)

  const handleInscription = async (coursId: number) => {
    if (!userData?.nom || !userData?.prenom || !coursId || isNaN(coursId)) {
      setModalMessage('Utilisateur ou cours invalide.');
      setShowModal(true);
      return;
    }
    try {
      // Validation côté front avec le schéma Zod
      const validated = datareservationSchema.parse({
        cours_id: coursId,
        utilisateur_nom: userData.nom,
        utilisateur_prenom: userData.prenom
      });

      await inscrireUtilisateur.mutateAsync(validated);
      setModalMessage('Inscription réussie !');
      setShowModal(true);
      // Invalide les queries pour rafraîchir la liste des inscrits
      utilisateursCoursQueries.forEach((q) => q.refetch && q.refetch());
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription au cours:', error);
      if (error?.message?.includes('déjà inscrit')) {
        setModalMessage('Vous êtes déjà inscrit à ce cours.');
      } else {
        setModalMessage('Erreur lors de l\'inscription.');
      }
      setShowModal(true);
    }
  };

  const handleAnnulation = async (coursId: number) => {
    if (!userData?.nom || !userData?.prenom || !coursId || isNaN(coursId)) {
      setModalMessage('Utilisateur ou cours invalide.');
      setShowModal(true);
      return;
    }
    try {
      await annulerInscription.mutateAsync({ cours_id: coursId, utilisateur_nom: userData.nom, utilisateur_prenom: userData.prenom });
      setModalMessage('Inscription annulée.');
      setShowModal(true);
      // Invalide les queries pour rafraîchir la liste des inscrits et des coursInscrits
      utilisateursCoursQueries.forEach((q) => q.refetch && q.refetch());
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'inscription:', error);
      setModalMessage('Erreur lors de l\'annulation.');
      setShowModal(true);
    }
  };

  if (loadingCours || loadingPlanning) {
    return <Spinner size="xl" />;
  }

  if (errorCours || errorPlanning) {
    return <Alert variant="danger" title="Erreur lors du chargement des données." />;
  }

  console.log(cours)

  return (
    <Provider store={store}>
      <Page>
        <PageSection>
          <Title headingLevel="h1">Inscriptions aux cours</Title>
          <div style={{ marginTop: '1rem' }}>
            {cours.map((c: CoursData) => {
              const isInscrit = Array.isArray(coursInscrits) && coursInscrits.some((ci: any) => ci.id === c.id && ci.utilisateur && ci.utilisateur.id === userData.id);
              return (
                <Card key={c.id} style={{ marginBottom: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/pages/cours/${c.id}/participants`)}>
                  <CardTitle>{c.nom}</CardTitle>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        <p>{c.jour} - {c.heure_debut} à {c.heure_fin}</p>
                      </FlexItem>
                      <FlexItem>
                        {isInscrit ? (
                          <Button variant="danger" onClick={e => { e.stopPropagation(); handleAnnulation(c.id); }}>
                            Annuler l'inscription
                          </Button>
                        ) : (
                          <Button variant="primary" onClick={e => { e.stopPropagation(); handleInscription(c.id); }}>
                            S'inscrire
                          </Button>
                        )}
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              );
            })}
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

