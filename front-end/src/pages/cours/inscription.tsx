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
  Alert,
  Badge
} from '@patternfly/react-core';
import { CalendarAltIcon, ClockIcon, UserIcon } from '@patternfly/react-icons';
import { useCours, useCoursPlanning, useCoursInscritsUtilisateur } from '../../hooks/useCours';
import { useUtilisateursPourTousLesCours, useInscrireUtilisateurReservation, useAnnulerInscriptionParNomPrenom } from '../../hooks/useInscriptions';
import { datareservationSchema } from '@clubmanager/types';

interface CoursData {
  id: number;
  date_cours: string;
  jour_semaine: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  professeurs: Array<{
    id: number;
    nom: string;
    prenom: string;
  }>;
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
  const inscrireUtilisateur = useInscrireUtilisateurReservation();
  const annulerInscription = useAnnulerInscriptionParNomPrenom();


  // Hook pour afficher les utilisateurs inscrits à tous les cours
  const utilisateursCoursQueries = useUtilisateursPourTousLesCours(cours);
  // Affiche le contenu de chaque query pour debug
  utilisateursCoursQueries.forEach((q, idx) => {
    console.log(`Cours idx ${idx} :`, q.data);
  });


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

  // Fonction pour formater la date SANS le jour de la semaine calculé
  const formatDateSansJour = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonction pour obtenir la couleur du badge selon le type de cours
  const getTypeCoursColor = (typeCours: string) => {
    const colors: { [key: string]: string } = {
      'JJB': '#2e7d32',
      'Grappling': '#f57c00',
      'Judo': '#1565c0'
    };
    return colors[typeCours] || '#666';
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
          <Title headingLevel="h1" style={{ marginBottom: '2rem' }}>
            Inscriptions aux cours
          </Title>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {cours?.map((c: any) => {
              const typeColor = getTypeCoursColor(c.type_cours);
              const typeBgColor = c.type_cours === 'JJB' ? '#e8f5e8' : 
                                  c.type_cours === 'Grappling' ? '#fff3e0' : 
                                  c.type_cours === 'Judo' ? '#e1f5fe' : '#e3f2fd';
              
              // Vérifier si l'utilisateur est déjà inscrit à ce cours
              const estInscrit = coursInscrits.some((ci: any) => ci.id === c.id);

              return (
                <Card 
                  key={c.id} 
                  isHoverable 
                  style={{ 
                    border: `2px solid ${typeColor}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    height: 'fit-content'
                  }}
                >
                  {/* Header avec type de cours */}
                  <div 
                    style={{ 
                      background: typeBgColor,
                      padding: '0.75rem',
                      borderBottom: `1px solid ${typeColor}`
                    }}
                  >
                    <CardTitle>
                      <Flex alignItems={{ default: 'alignItemsCenter' }}>
                        <FlexItem>
                          <Badge 
                            style={{ 
                              backgroundColor: typeColor, 
                              color: 'white',
                              fontSize: '0.9rem',
                              padding: '0.25rem 0.75rem'
                            }}
                          >
                            {c.type_cours}
                          </Badge>
                        </FlexItem>
                        {estInscrit && (
                          <FlexItem>
                            <Badge 
                              style={{ 
                                backgroundColor: '#28a745', 
                                color: 'white',
                                fontSize: '0.8rem',
                                padding: '0.2rem 0.5rem',
                                marginLeft: '0.5rem'
                              }}
                            >
                              ✓ Inscrit
                            </Badge>
                          </FlexItem>
                        )}
                      </Flex>
                    </CardTitle>
                  </div>
                  
                  {/* Corps de la carte */}
                  <CardBody style={{ padding: '1.25rem' }}>
                    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                      {/* Date et jour */}
                      <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <CalendarAltIcon 
                            style={{ 
                              marginRight: 10, 
                              color: typeColor, 
                              fontSize: '1.2rem' 
                            }} 
                          />
                          <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#333' }}>
                            {c.date_cours ? (
                              <>
                                {c.jour_semaine} - {formatDateSansJour(c.date_cours)}
                              </>
                            ) : (
                              c.jour_semaine || c.jour
                            )}
                          </span>
                        </Flex>
                      </FlexItem>
                      
                      {/* Horaires */}
                      <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <ClockIcon 
                            style={{ 
                              marginRight: 10, 
                              color: '#6a6e73', 
                              fontSize: '1.1rem' 
                            }} 
                          />
                          <span style={{ fontWeight: 500, fontSize: '1rem', color: '#555' }}>
                            {c.heure_debut} - {c.heure_fin}
                          </span>
                        </Flex>
                      </FlexItem>
                      
                      {/* Professeurs */}
                      {c.professeurs && c.professeurs.length > 0 && (
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                            <UserIcon 
                              style={{ 
                                marginRight: 10, 
                                color: '#6a6e73', 
                                fontSize: '1.1rem' 
                              }} 
                            />
                            <span style={{ fontWeight: 500, fontSize: '0.95rem', color: '#555' }}>
                              Professeur{c.professeurs.length > 1 ? 's' : ''}:
                            </span>
                          </Flex>
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {c.professeurs.map((prof: any, idx: number) => (
                              <Badge 
                                key={idx}
                                style={{ 
                                  backgroundColor: '#f8f9fa',
                                  color: '#495057',
                                  border: '1px solid #dee2e6',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.85rem'
                                }}
                              >
                                {prof.prenom} {prof.nom}
                              </Badge>
                            ))}
                          </div>
                        </FlexItem>
                      )}
                    </Flex>
                  </CardBody>
                  
                  {/* Footer avec boutons d'action */}
                  <div style={{ 
                    padding: '1rem 1.25rem', 
                    background: '#f8f9fa',
                    borderTop: '1px solid #dee2e6'
                  }}>
                    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      {estInscrit ? (
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleAnnulation(c.id)}
                          style={{ fontSize: '0.9rem' }}
                        >
                          Se désinscrire
                        </Button>
                      ) : (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleInscription(c.id)}
                          style={{ 
                            backgroundColor: typeColor,
                            borderColor: typeColor,
                            fontSize: '0.9rem'
                          }}
                        >
                          S'inscrire
                        </Button>
                      )}
                      
                      {/* Bouton pour voir les inscrits */}
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => navigate(`/pages/cours/${c.id}/participants`)}
                        style={{ fontSize: '0.9rem' }}
                      >
                        Voir les participants
                      </Button>
                      
                      {/* Affichage du nombre d'inscrits si disponible */}
                      {utilisateursCoursQueries[cours.indexOf(c)]?.data && (
                        <FlexItem style={{ marginLeft: 'auto' }}>
                          <span style={{ 
                            fontSize: '0.85rem', 
                            color: '#6c757d',
                            fontStyle: 'italic'
                          }}>
                            {utilisateursCoursQueries[cours.indexOf(c)].data.length} inscrit{utilisateursCoursQueries[cours.indexOf(c)].data.length > 1 ? 's' : ''}
                          </span>
                        </FlexItem>
                      )}
                    </Flex>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {cours?.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <Title headingLevel="h3" style={{ color: '#6c757d', marginBottom: '1rem' }}>
                Aucun cours disponible
              </Title>
              <p style={{ color: '#6c757d' }}>
                Il n'y a actuellement aucun cours disponible pour l'inscription.
              </p>
            </div>
          )}
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

