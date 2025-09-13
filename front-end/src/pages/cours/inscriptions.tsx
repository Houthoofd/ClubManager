import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import {
  PageSection,
  Title,
  Button,
  Spinner,
  Alert,
} from '@patternfly/react-core';
import {
  UserIcon,
  TableIcon,
  CalendarAltIcon,
  ClockIcon
} from '@patternfly/react-icons';
import store from '../../redux/store';
import type {
  UserData,
  CoursData as CoursDataType,
  JourCours,
  ConfirmationResult,
  DataReservation,
  BookResult,
  DataInscription,
  UtilisateursParCours,
  Utilisateur,
  DataAnnulation,
  DataValidation
} from '@clubmanager/types';
import { useUtilisateurs } from '../../hooks/useUtilisateurs';
import { useCours, useCoursPlanning, useCoursInscritsUtilisateur } from '../../hooks/useCours';
import { useUtilisateursPourTousLesCours, useInscrireUtilisateurReservation, useAnnulerInscriptionParNomPrenom } from '../../hooks/useInscriptions';
import { datareservationSchema } from '@clubmanager/types';
import { UtilisateurService } from '../../services/UtilisateurService';
import { ModalConfirmation, ModalResultat } from '../../components/common/modal/ModalsGestion';
import { ModalWithHelp } from '../../components/common/modal/ModalWithHelp';
import OngletTableauUtilisateurs from '../../components/utilisateurs/OngletTableauUtilisateurs';
import OngletAjoutUtilisateur from '../../components/utilisateurs/OngletAjoutUtilisateur';
import { PageHeader } from '../../components/common/PageHeader';
import { TabContainer } from '../../components/common/TabContainer';
import '../../styles/inscription.css';

interface CoursData extends CoursDataType {
  jour?: string;
}

const Inscriptions = () => {
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [utilisateur, setUtilisateur] = useState<UserData>();
  const [userSchema, setUserSchema] = useState<UserData>();
  const [utilisateurs, setUtilisateurs] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [existenceMessages, setExistenceMessages] = useState<any>({});
  const [selectOptions, setSelectOptions] = useState<any>({});
  const [selectOpenStates, setSelectOpenStates] = useState<{ [key: string]: boolean }>({});

  // Modals pour la gestion des utilisateurs
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [utilisateurToDelete, setUtilisateurToDelete] = useState<UserData | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState('');
  const [resultModalLoading, setResultModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalVariant, setConfirmModalVariant] = useState<'confirmation' | 'success' | 'error' | 'loading'>('confirmation');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalError, setConfirmModalError] = useState<string | null>(null);
  const [confirmModalSuccess, setConfirmModalSuccess] = useState('');

  // Modals pour les inscriptions
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);

  // Données utilisateur depuis le localStorage
  const [userData] = useState(() => {
    const storedData = localStorage.getItem('userData');
    return storedData ? JSON.parse(storedData).data : null;
  });

  // Hooks React Query pour les utilisateurs
  const { data: utilisateursData = [], isLoading: isLoadingUtilisateurs, error: errorUtilisateurs } = useUtilisateurs();

  // Hooks React Query pour les cours et inscriptions
  const { data: cours = [], isLoading: loadingCours, error: errorCours } = useCours();
  const { data: planning = [], isLoading: loadingPlanning, error: errorPlanning } = useCoursPlanning();
  const { data: coursInscrits = [] } = useCoursInscritsUtilisateur(userData?.id);
  const inscrireUtilisateur = useInscrireUtilisateurReservation();
  const annulerInscription = useAnnulerInscriptionParNomPrenom();

  // Hook pour afficher les utilisateurs inscrits à tous les cours
  const utilisateursCoursQueries = useUtilisateursPourTousLesCours(cours);

  useEffect(() => {
    const initialiser = async () => {
      setResultModalLoading(true);
      setResultModalMessage('Initialisation...');
      setResultModalOpen(true);
      try {
        const schema = await UtilisateurService.fetchUserSchema();

        if (schema && Array.isArray(schema) && schema.length > 0) {
          const firstItem = schema[0];
          if (firstItem && typeof firstItem === 'object') {
            const keys = Object.keys(firstItem);
            const initialFormData = UtilisateurService.initaliserFormData(keys);

            if (initialFormData && Object.keys(initialFormData).length > 0) {
              setFormData(initialFormData);
              setUserSchema(schema);

              const options: any = {};
              for (const key of keys) {
                if (key.endsWith('_id')) {
                  try {
                    const selectOptionsData = await UtilisateurService.fetchSelectOptions(key);
                    options[key] = selectOptionsData;
                  } catch (error) {
                    console.error(`Erreur pour ${key}:`, error);
                    options[key] = [];
                  }
                }
              }
              setSelectOptions(options);
            } else {
              throw new Error('Impossible d\'initialiser les données du formulaire');
            }
          } else {
            throw new Error('Structure de schéma invalide');
          }
        } else {
          throw new Error('Schéma utilisateur vide ou invalide');
        }

        setResultModalOpen(false);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setResultModalMessage('Erreur lors de l\'initialisation');
        setResultModalLoading(false);
      }
    };
    initialiser();
  }, []);

  useEffect(() => {
    if (utilisateursData.length > 0) {
      setUtilisateurs(utilisateursData);
    }
  }, [utilisateursData]);

  const handleChange = async (value: string, key: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));

    if (['first_name', 'last_name', 'email', 'nom_utilisateur'].includes(key)) {
      try {
        const result = await UtilisateurService.checkFieldExistence(key, value);
        setExistenceMessages(prev => ({
          ...prev,
          [key]: result.message || (result.exists ? `Ce champ existe déjà : ${value}` : ''),
        }));
      } catch (error) {
        setExistenceMessages(prev => ({
          ...prev,
          [key]: 'Erreur de vérification.',
        }));
      }
    }
  };

  const handleSelectToggle = (key: string, isOpen: boolean) => {
    setSelectOpenStates(prev => ({ ...prev, [key]: isOpen }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setConfirmModalVariant('confirmation');
    setConfirmModalTitle('Confirmer la création de l\'utilisateur');
    setConfirmModalError(null);
    setConfirmModalSuccess('');
    setConfirmModalOpen(true);
  };

  const confirmAddUser = async () => {
    setConfirmModalVariant('loading');
    setConfirmModalTitle('Création en cours...');
    try {
      const isEmailUnique = await UtilisateurService.checkEmailUniqueness(formData.email);
      if (!isEmailUnique) {
        setConfirmModalVariant('error');
        setConfirmModalTitle('Erreur de validation');
        setConfirmModalError('Cet email est déjà utilisé par un autre utilisateur.');
        return;
      }

      const result = await UtilisateurService.ajouterUtilisateur(formData);

      if (result.success) {
        setUtilisateur(result.data.data);
        setConfirmModalVariant('success');
        setConfirmModalTitle('Utilisateur créé avec succès !');
        setConfirmModalSuccess('L\'utilisateur a été ajouté au système et peut maintenant se connecter.');

        const keys = Object.keys(formData);
        setFormData(UtilisateurService.initaliserFormData(keys));
        setExistenceMessages({});
      } else {
        setConfirmModalVariant('error');
        setConfirmModalTitle('Erreur lors de la création');
        setConfirmModalError(result.message || 'Une erreur est survenue lors de la création de l\'utilisateur.');
      }
    } catch (error) {
      setConfirmModalVariant('error');
      setConfirmModalTitle('Erreur système');
      setConfirmModalError('Une erreur technique est survenue. Veuillez réessayer.');
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setConfirmModalVariant('confirmation');
    setConfirmModalTitle('');
    setConfirmModalError(null);
    setConfirmModalSuccess('');
  };

  const confirmDeleteUtilisateur = async () => {
    if (!utilisateurToDelete) return;

    setResultModalLoading(true);
    setResultModalMessage('Suppression en cours...');
    setResultModalOpen(true);

    setConfirmDeleteOpen(false);
    setUtilisateurToDelete(null);
  };

  const handleInscription = async (coursId: number) => {
    if (!userData?.nom || !userData?.prenom || !coursId || isNaN(coursId)) {
      setModalMessage('Utilisateur ou cours invalide.');
      setModalSuccess(false);
      setShowModal(true);
      return;
    }
    try {
      const validated = datareservationSchema.parse({
        cours_id: coursId,
        utilisateur_nom: userData.nom,
        utilisateur_prenom: userData.prenom
      });
      await inscrireUtilisateur.mutateAsync(validated);
      setModalMessage('Inscription réussie ! Vous êtes maintenant inscrit à ce cours.');
      setModalSuccess(true);
      setShowModal(true);
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
      utilisateursCoursQueries.forEach((q) => q.refetch && q.refetch());
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'inscription:', error);
      setModalMessage('Erreur lors de la désinscription. Veuillez réessayer.');
      setModalSuccess(false);
      setShowModal(true);
    }
  };

  const getTypeCoursClass = (typeCours: string) => {
    return `inscription-type-badge ${typeCours.toLowerCase()}`;
  };

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

  const columns = [
    { key: 'first_name', label: 'Prénom' },
    { key: 'last_name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Statut' },
  ];

  const tabs = [
    {
      key: 0,
      title: 'Consulter les utilisateurs',
      icon: <TableIcon />,
      content: (
        <OngletTableauUtilisateurs
          utilisateurs={utilisateurs}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          userSchema={userSchema}
          isLoading={isLoading}
        />
      )
    },
    {
      key: 1,
      title: 'Ajouter un utilisateur',
      icon: <UserIcon />,
      content: formData && Object.keys(formData).length > 0 ? (
        <>
          <OngletAjoutUtilisateur
            formData={formData}
            selectOptions={selectOptions}
            selectOpenStates={selectOpenStates}
            existenceMessages={existenceMessages}
            dernierUtilisateur={utilisateur}
            onChange={handleChange}
            onSelectToggle={handleSelectToggle}
            onSubmit={handleSubmit}
          />

          <ModalWithHelp
            isOpen={confirmModalOpen}
            onClose={closeConfirmModal}
            onConfirm={confirmAddUser}
            title={confirmModalTitle}
            variant={confirmModalVariant}
            data={formData}
            selectOptions={selectOptions}
            isLoading={confirmModalVariant === 'loading'}
            error={confirmModalError}
            successMessage={confirmModalSuccess}
          />
        </>
      ) : (
        <div className="loading-container">
          <p>Chargement du formulaire...</p>
        </div>
      )
    }
  ];

  if (loadingCours || loadingPlanning) {
    return (
      <div className="inscription-loading">
        <Spinner size="xl" />
      </div>
    );
  }

  if (errorCours || errorPlanning) {
    return (
      <div className="inscription-container">
        <div className="inscription-content">
          <Alert variant="danger" title="Erreur lors du chargement des données." />
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <div className="users-page">
        {activeTabKey === 0 && (
          <>
            <PageHeader
              title="Gestion des utilisateurs"
              subtitle="Ajoutez de nouveaux utilisateurs et consultez la liste existante"
              variant="users"
            />
            <PageSection className="users-content">
              <TabContainer
                tabs={tabs}
                activeKey={activeTabKey}
                onTabSelect={setActiveTabKey}
                variant="modern"
              />
            </PageSection>
          </>
        )}

        {activeTabKey === 1 && (
          <div className="inscription-container">
            <div className="inscription-content">
              <div className="inscription-header">
                <Title headingLevel="h1" size="2xl" className="inscription-header-title">
                  Inscriptions aux cours
                </Title>
                <p className="inscription-header-subtitle">
                  Inscrivez-vous aux cours disponibles et gérez vos participations
                </p>
              </div>

              <div className="inscription-cards-grid">
                {cours?.map((c: any) => {
                  const estInscrit = coursInscrits.some((ci: any) => ci.id === c.id);
                  return (
                    <div key={c.id} className="inscription-card">
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

                      <div className="inscription-card-body">
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

                        <div className="inscription-info-item">
                          <ClockIcon className="inscription-info-icon" />
                          <span className="inscription-info-text">
                            {c.heure_debut} - {c.heure_fin}
                          </span>
                        </div>

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
            </div>
          </>
        )}

        <ModalConfirmation
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={confirmDeleteUtilisateur}
          title="Confirmer la suppression"
          message={
            utilisateurToDelete
              ? `Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>${String((utilisateurToDelete as any).first_name)} ${String((utilisateurToDelete as any).last_name)}</strong> ?`
              : ''
          }
          confirmText="Supprimer"
          variant="danger"
        />

        <ModalResultat
          isOpen={resultModalOpen}
          onClose={() => setResultModalOpen(false)}
          title="Information"
          message={resultModalMessage}
          isLoading={resultModalLoading}
        />

        <ModalWithHelp
          title={modalSuccess ? "Succès" : "Erreur"}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          variant={modalSuccess ? 'success' : 'error'}
          successMessage={modalSuccess ? modalMessage : ''}
          error={modalSuccess ? null : modalMessage}
        />
      </div>
    </Provider>
  );
};

export default Inscriptions;

