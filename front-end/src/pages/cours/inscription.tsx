import { useState } from 'react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import store from '../../redux/store';
import {
  PageSection,
  Button,
  Spinner,
  Alert,
} from '@patternfly/react-core';
import { CalendarAltIcon, ClockIcon, UserIcon } from '@patternfly/react-icons';
import { useCours, useCoursPlanning, useCoursInscritsUtilisateur } from '../../hooks/useCours';
import { useUtilisateursPourTousLesCours, useInscrireUtilisateurReservation, useAnnulerInscriptionParNomPrenom } from '../../hooks/useInscriptions';
import { datareservationSchema } from '@clubmanager/types';
import ModalWithHelp from '../../components/common/modal/modalwithhelp';
import { PageHeader } from '../../components/common/PageHeader';
import '../../styles/inscription.css';

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
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);
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
      setModalSuccess(false);
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
      setModalMessage('Inscription réussie ! Vous êtes maintenant inscrit à ce cours.');
      setModalSuccess(true);
      setShowModal(true);
      // Invalide les queries pour rafraîchir la liste des inscrits
      utilisateursCoursQueries.forEach((q) => q.refetch && q.refetch());
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription au cours:', error);
      if (error?.message?.includes('déjà inscrit')) {
        setModalMessage('Vous êtes déjà inscrit à ce cours.');
      } else {
        setModalMessage('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
      setModalSuccess(false);
      setShowModal(true);
    }
  };

  const handleAnnulation = async (coursId: number) => {
    if (!userData?.nom || !userData?.prenom || !coursId || isNaN(coursId)) {
      setModalMessage('Utilisateur ou cours invalide.');
      setModalSuccess(false);
      setShowModal(true);
      return;
    }
    try {
      await annulerInscription.mutateAsync({ cours_id: coursId, utilisateur_nom: userData.nom, utilisateur_prenom: userData.prenom });
      setModalMessage('Désinscription réussie ! Vous n\'êtes plus inscrit à ce cours.');
      setModalSuccess(true);
      setShowModal(true);
      // Invalide les queries pour rafraîchir la liste des inscrits et des coursInscrits
      utilisateursCoursQueries.forEach((q) => q.refetch && q.refetch());
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'inscription:', error);
      setModalMessage('Erreur lors de la désinscription. Veuillez réessayer.');
      setModalSuccess(false);
      setShowModal(true);
    }
  };

  // Fonction pour obtenir les classes CSS du badge selon le type de cours
  const getTypeCoursClass = (typeCours: string) => {
    return `inscription-type-badge ${typeCours.toLowerCase()}`;
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

  if (loadingCours || loadingPlanning) {
    return (
      <div className="inscription-page">
        <PageHeader
          title="Inscriptions aux cours"
          subtitle="Inscrivez-vous aux cours disponibles et gérez vos participations"
          variant="courses"
        />
        <PageSection className="inscription-content">
          <div className="inscription-loading">
            <Spinner size="xl" />
          </div>
        </PageSection>
      </div>
    );
  }

  if (errorCours || errorPlanning) {
    return (
      <div className="inscription-page">
        <PageHeader
          title="Inscriptions aux cours"
          subtitle="Inscrivez-vous aux cours disponibles et gérez vos participations"
          variant="courses"
        />
        <PageSection className="inscription-content">
          <Alert variant="danger" title="Erreur lors du chargement des données." />
        </PageSection>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <div className="inscription-page">
        <PageHeader
          title="Inscriptions aux cours"
          subtitle="Inscrivez-vous aux cours disponibles et gérez vos participations"
          variant="courses"
        />

        <PageSection className="inscription-content">
          {/* Grid des cours */}
          <div className="inscription-cards-grid">
            {cours?.map((c: any) => {
              const estInscrit = coursInscrits.some((ci: any) => ci.id === c.id);

              return (
                <div key={c.id} className="inscription-card">
                  {/* Header avec type de cours */}
                  <div className="inscription-card-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className={getTypeCoursClass(c.type_cours)}>
                        {c.type_cours}
                      </span>
                      {estInscrit && (
                        <span className="inscription-inscrit-badge">
                          ✓ Inscrit
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Corps de la carte */}
                  <div className="inscription-card-body">
                    {/* Date et jour */}
                    <div className="inscription-info-item">
                      <CalendarAltIcon className="inscription-info-icon" />
                      <span className="inscription-date-text">
                        {c.date_cours ? (
                          <>
                            {c.jour_semaine} - {formatDateSansJour(c.date_cours)}
                          </>
                        ) : (
                          c.jour_semaine || c.jour
                        )}
                      </span>
                    </div>
                    
                    {/* Horaires */}
                    <div className="inscription-info-item">
                      <ClockIcon className="inscription-info-icon" />
                      <span className="inscription-info-text">
                        {c.heure_debut} - {c.heure_fin}
                      </span>
                    </div>
                    
                    {/* Professeurs */}
                    {c.professeurs && c.professeurs.length > 0 && (
                      <div className="inscription-info-item">
                        <UserIcon className="inscription-info-icon" />
                        <div>
                          <span className="inscription-info-text">
                            Professeur{c.professeurs.length > 1 ? 's' : ''}:
                          </span>
                          <div className="inscription-professeurs-container">
                            {c.professeurs.map((prof: any, idx: number) => (
                              <span key={idx} className="inscription-professeur-badge">
                                {prof.prenom} {prof.nom}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer avec boutons d'action */}
                  <div className="inscription-card-footer">
                    <div className="inscription-actions">
                      {estInscrit ? (
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleAnnulation(c.id)}
                        >
                          Se désinscrire
                        </Button>
                      ) : (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleInscription(c.id)}
                        >
                          S'inscrire
                        </Button>
                      )}
                      
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => navigate(`/pages/cours/${c.id}/participants`)}
                      >
                        Voir les participants
                      </Button>
                    </div>
                    
                    {/* Affichage du nombre d'inscrits */}
                    {utilisateursCoursQueries[cours.indexOf(c)]?.data && (
                      <span className="inscription-participants-count">
                        {utilisateursCoursQueries[cours.indexOf(c)].data.length} inscrit{utilisateursCoursQueries[cours.indexOf(c)].data.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {cours?.length === 0 && (
            <div className="inscription-empty-state">
              <Title headingLevel="h3" style={{ color: '#6c757d', marginBottom: '1rem' }}>
                Aucun cours disponible
              </Title>
              <p>
                Il n'y a actuellement aucun cours disponible pour l'inscription.
              </p>
            </div>
          )}
        </PageSection>
        
        <ModalWithHelp
          title={modalSuccess ? "Succès" : "Erreur"}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          variant={modalSuccess ? 'success' : 'error'}
          context="creation" // Ajout du contexte
          successMessage={modalSuccess ? modalMessage : ''}
          error={modalSuccess ? null : modalMessage}
        />
      </div>
    </Provider>
  );
};

export default Inscription;


