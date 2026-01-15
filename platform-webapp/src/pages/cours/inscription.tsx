import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import store from '../../redux/store';
import {
  PageSection,
  Button,
  Spinner,
  Alert,
  Title
} from '@patternfly/react-core';
import { CalendarAltIcon, ClockIcon, UserIcon } from '@patternfly/react-icons';
import { useCours, useCoursPlanning, useCoursInscritsUtilisateur } from '../../hooks/useCours';
import { useUtilisateursPourTousLesCours, useInscrireUtilisateurReservation, useAnnulerInscriptionParNomPrenom } from '../../hooks/useInscriptions';
import { datareservationSchema } from '@clubmanager/types';
import ModalWithHelp from '../../components/common/modal/modalwithhelp';
import { PageHeader } from '../../components/common/PageHeader';
import CoursModals from '../../components/cours/CoursModals';
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
  // Récupère userData du localStorage AVANT le montage
  const [userData] = useState(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Supporte les deux formats possibles
      return parsed.first_name && parsed.last_name ? parsed : parsed.data;
    }
    return null;
  });

  // État pour le rôle de l'utilisateur
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<'inscription' | 'desinscription' | null>(null);
  const [coursInscrit, setCoursInscrit] = useState<any | null>(null);
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
    
  });

  // Récupération du rôle de l'utilisateur connecté
  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const role = parsedData?.status;
      setUserRole(role);
    }
  }, []);

  // Fonction pour vérifier si l'utilisateur peut voir les participants
  const canViewParticipants = () => {
    return userRole !== 'utilisateur';
  };

  const handleInscription = async (coursId: number) => {
    // Utilise first_name et last_name pour l'inscription
    if (!userData?.first_name || !userData?.last_name || !coursId || isNaN(coursId)) {
      setModalMessage('Utilisateur ou cours invalide.');
      setModalSuccess(false);
      setShowModal(true);
      return;
    }
    try {
      // Validation côté front avec le schéma Zod
      const validated = datareservationSchema.parse({
        cours_id: coursId,
        utilisateur_nom: userData.last_name,
        utilisateur_prenom: userData.first_name
      });

      await inscrireUtilisateur.mutateAsync(validated);
      setCoursInscrit(cours.find((c: any) => c.id === coursId));
      setSuccessMessage(
        `Inscription au cours ${cours.find((c: any) => c.id === coursId)?.date_cours || ''} réussie`
      );
      setSuccessType('inscription');
      setShowSuccessModal(true);
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
    if (!userData?.first_name || !userData?.last_name || !coursId || isNaN(coursId)) {
      setModalMessage('Utilisateur ou cours invalide.');
      setModalSuccess(false);
      setShowModal(true);
      return;
    }
    try {
      await annulerInscription.mutateAsync({
        cours_id: coursId,
        utilisateur_nom: userData.last_name,
        utilisateur_prenom: userData.first_name
      });
      setCoursInscrit(cours.find((c: any) => c.id === coursId));
      setSuccessMessage(
        `Désinscription du cours ${cours.find((c: any) => c.id === coursId)?.date_cours || ''} réussie`
      );
      setSuccessType('desinscription');
      setShowSuccessModal(true);
      utilisateursCoursQueries.forEach((q) => q.refetch && q.refetch());
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'inscription:', error);
      setSuccessMessage('Erreur lors de la désinscription. Veuillez réessayer.');
      setSuccessType('desinscription');
      setShowSuccessModal(true);
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
                      
                      {/* Bouton "Voir les participants" - masqué pour les utilisateurs normaux */}
                      {canViewParticipants() && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => navigate(`/pages/cours/${c.id}/participants`)}
                        >
                          Voir les participants
                        </Button>
                      )}
                    </div>
                    
                    {/* Affichage du nombre d'inscrits - visible pour tous */}
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
        
    
        {/* Ajout de la modal CoursModals pour le succès d'inscription */}
        <CoursModals
          isModalOpen={showSuccessModal}
          successMessage={successMessage}
          professeurADissocier={null}
          onAnnulerDissociation={() => {
            setShowSuccessModal(false);
            setSuccessMessage(null);
            setSuccessType(null);
          }}
          onConfirmerDissociation={() => {}}
          showSupprimerModal={false}
          coursASupprimer={null}
          onAnnulerSuppression={() => {}}
          onConfirmerSuppression={() => {}}
          showAjoutModal={false}
          ajoutSuccess={false}
          ajoutMessage={null}
          onFermerAjoutModal={() => {}}
          showConfirmModificationModal={false}
          modificationsResume={[]}
          originalCours={null}
          onAnnulerConfirmationModification={() => {}}
          onConfirmerModification={() => {}}
        />
      </div>
    </Provider>
  );
};

export default Inscription;


