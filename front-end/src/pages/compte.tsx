import React, { useState, useEffect } from 'react';
import { 
  PageSection, 
  Spinner, 
  Alert, 
  Tabs, 
  Tab,
  Button,
  TextInput,
  FormSelect,
  Title
} from '@patternfly/react-core';
import { 
  PageHeader 
} from '../components/common/PageHeader';
import { 
  UserIcon, 
  ChartLineIcon, 
  CreditCardIcon,
  EditIcon,
  TimesIcon
} from '@patternfly/react-icons';
import { useCompteData } from '../hooks/useCompteData';
import StatistiquesTab from '../components/compte/StatistiquesTab';
import PaiementsTab from '../components/compte/PaiementsTab';
import CompteInfoTab from '../components/compte/CompteInfoTab';
import ResultModal from '../components/common/modal/ResultModal';
import ConfirmModal from '../components/common/modal/ConfirmModal';
import ResumeConfirmModal from '../components/common/modal/ResumeConfirmModal';

function formatDateForInput(isoDateString: string): string {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

const Compte = () => {
  const [activeTabKey, setActiveTabKey] = useState<string>('0');
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState('');
  const [resultModalSuccess, setResultModalSuccess] = useState(false);
  const [modificationsResume, setModificationsResume] = useState<ModificationItem[]>([]);
  const [form, setForm] = useState({
    email: '',
    date_naissance: '',
    genres: '',
    grades: '',
    abonnement: '',
    status: '',
    password: ''
  });
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [disabledFields, setDisabledFields] = useState<{ [key: string]: boolean }>({});
  const [userRole, setUserRole] = useState<string | null>(null);

  const {
    userData,
    utilisateurId,
    compteInfo,
    paiementsEcheances,
    updateCompte,
    abonnements,
    grades,
    status,
    genres,
    isDataReady,
    statsDataReady,
    statFrequentationForGraph,
    loadingCompte,
    errorCompte,
  } = useCompteData();

  // Récupération du rôle de l'utilisateur connecté
  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const role = parsedData?.status;
      setUserRole(role);
    }
  }, []);

  // Fonction pour vérifier si l'utilisateur peut modifier le statut
  const canEditStatus = () => {
    return userRole === 'super-administrateur';
  };

  // initialisation du formulaire
  useEffect(() => {
    if (compteInfo) {
      setShowPasswordField(!compteInfo.mot_de_passe);
      setForm({
        email: compteInfo.email || '',
        date_naissance: formatDateForInput(compteInfo.date_naissance) || '',
        genres: compteInfo.genres || '',
        grades: compteInfo.grades || '',
        abonnement: compteInfo.abonnement || '',
        status: compteInfo.status || '',
        password: ''
      });

      // Définir les champs désactivés selon le rôle
      setDisabledFields({
        status: !canEditStatus(), // Seuls les super-admin peuvent modifier le statut
        grades: !canEditStatus()  // Optionnel: restreindre aussi les grades aux super-admin
      });
    }
  }, [compteInfo, userRole]);

  // handlers
  const handleTabClick = (_event: React.SyntheticEvent, eventKey: string | number) => {
    setActiveTabKey(String(eventKey));
  };

  const handleEditClick = (field: string) => {
    // Empêcher l'édition du statut si l'utilisateur n'a pas les droits
    if (field === 'status' && !canEditStatus()) {
      setResultModalMessage('Vous n\'avez pas les permissions pour modifier le statut/rôle.');
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
      return;
    }

    setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailChange = (value: string) => setForm(prev => ({ ...prev, email: value }));
  const handlePasswordChange = (value: string) => {
    setForm(prev => ({ ...prev, password: value }));
  };

  const getChangesSummary = () => {
    const changes: { [key: string]: string } = {};
    Object.keys(editingFields).forEach(field => {
      if (editingFields[field]) changes[field] = (form as any)[field];
    });
    return changes;
  };

  // Gestion des résultats de mutation
  useEffect(() => {
    if (updateCompte.isSuccess) {
      setResultModalMessage('Les modifications apportées ont été sauvegardées avec succès.');
      setResultModalSuccess(true);
      setIsResultModalOpen(true);
      setEditingFields({});
      setDisabledFields({});
    }
    if (updateCompte.isError) {
      setResultModalMessage('Une erreur est survenue lors de la sauvegarde des modifications. Veuillez réessayer.');
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
    }
  }, [updateCompte.isSuccess, updateCompte.isError, updateCompte.error]);

  // Fonction pour obtenir le nom d'affichage d'une valeur
  const getDisplayValue = (key: string, value: any) => {
    if (!value || value === '') return 'Non défini';
    
    switch (key) {
      case 'genres':
        const genre = genres?.find(g => g.id == value);
        return genre?.genre_name || value;
      case 'grades':
        const grade = grades?.find(g => g.id == value);
        return grade?.grade_id || value;
      case 'abonnement':
        const abonnement = abonnements?.find(a => a.id == value);
        return abonnement?.nom_plan || value;
      case 'status':
        const statusItem = status?.find(s => s.id == value);
        return statusItem?.nom_status || value;
      case 'mot_de_passe':
        return '••••••••';
      default:
        return value;
    }
  };

  // Affiche le résumé des changements dans la modal avant modification
  const handleApplyChanges = () => {
    const changes = getChangesSummary();
    // Ajout du mot de passe s'il a été modifié
    if (editingFields.password && form.password.trim() !== '') {
      changes['password'] = form.password;
    }

    if (Object.keys(changes).length > 0) {
      const modifications: ModificationItem[] = Object.entries(changes)
        .map(([key, newValue]) => {
          // Récupérer la valeur originale depuis compteInfo.utilisateur
          let originalValue = compteInfo?.utilisateur?.[key];
          
          // Obtenir les noms d'affichage avec fallback
          let originalDisplay = 'Non défini';
          let newDisplay = String(newValue || 'Vide');
          
          // Mapping des noms de champs pour l'affichage
          const fieldDisplayNames: { [key: string]: string } = {
            'email': 'Email',
            'date_naissance': 'Date de naissance',
            'genres': 'Genre',
            'grades': 'Grade',
            'abonnement': 'Abonnement',
            'status': 'Statut/Rôle',
            'password': 'Mot de passe'
          };
          
          // Conversion des valeurs originales
          if (originalValue && originalValue !== '' && originalValue !== null) {
            if (key === 'genres' && genres) {
              let genre = genres.find(g => g.genre_name === originalValue);
              if (!genre) {
                genre = genres.find(g => String(g.id) === String(originalValue));
              }
              originalDisplay = genre?.genre_name || `Genre: ${originalValue}`;
            } else if (key === 'grades' && grades) {
              let grade = grades.find(g => g.grade_id === originalValue);
              if (!grade) {
                grade = grades.find(g => String(g.id) === String(originalValue));
              }
              originalDisplay = grade?.grade_id || `Grade: ${originalValue}`;
            } else if (key === 'abonnement' && abonnements) {
              let abonnement = abonnements.find(a => a.nom_plan === originalValue);
              if (!abonnement) {
                abonnement = abonnements.find(a => String(a.id) === String(originalValue));
              }
              originalDisplay = abonnement?.nom_plan || `Abonnement: ${originalValue}`;
            } else if (key === 'status' && status) {
              let statusItem = status.find(s => s.nom_status === originalValue);
              if (!statusItem) {
                statusItem = status.find(s => String(s.id) === String(originalValue));
              }
              originalDisplay = statusItem?.nom_status || `Status: ${originalValue}`;
            } else if (key === 'password') {
              originalDisplay = '••••••••';
            } else {
              originalDisplay = String(originalValue);
            }
          }
          
          // Conversion des nouvelles valeurs
          if (newValue && newValue !== '') {
            if (key === 'genres' && genres) {
              let genre = genres.find(g => g.genre_name === newValue);
              if (!genre) {
                genre = genres.find(g => String(g.id) === String(newValue));
              }
              newDisplay = genre?.genre_name || newValue;
            } else if (key === 'grades' && grades) {
              let grade = grades.find(g => g.grade_id === newValue);
              if (!grade) {
                grade = grades.find(g => String(g.id) === String(newValue));
              }
              newDisplay = grade?.grade_id || newValue;
            } else if (key === 'abonnement' && abonnements) {
              let abonnement = abonnements.find(a => a.nom_plan === newValue);
              if (!abonnement) {
                abonnement = abonnements.find(a => String(a.id) === String(newValue));
              }
              newDisplay = abonnement?.nom_plan || newValue;
            } else if (key === 'status' && status) {
              let statusItem = status.find(s => s.nom_status === newValue);
              if (!statusItem) {
                statusItem = status.find(s => String(s.id) === String(newValue));
              }
              newDisplay = statusItem?.nom_status || newValue;
            } else if (key === 'password') {
              newDisplay = 'Nouveau mot de passe';
            } else {
              newDisplay = String(newValue);
            }
          }
          
          return {
            field: fieldDisplayNames[key] || key,
            oldValue: originalDisplay,
            newValue: newDisplay
          };
        });
      
      setModificationsResume(modifications);
      setShowConfirmModal(true);
    } else {
      setResultModalMessage("Aucune modification détectée.");
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
    }
  };

  // Fonction pour confirmer les modifications
  const confirmerModifications = async () => {
    setShowConfirmModal(false);

    const changes = getChangesSummary();
    // Ajout du mot de passe s'il a été modifié
    if (editingFields.password && form.password.trim() !== '') {
      changes['password'] = form.password;
    }

    const changesToSend = { id: utilisateurId, ...changes };
    
    // Nettoie les champs vides (mais garde le password s'il a été fourni)
    Object.keys(changesToSend).forEach(key => {
      if (
        key !== 'id' &&
        key !== 'password' && // Ne pas supprimer le password même s'il est vide
        (changesToSend[key] === undefined ||
          changesToSend[key] === null ||
          changesToSend[key] === '')
      ) {
        delete changesToSend[key];
      }
    });

    updateCompte.mutate(changesToSend);
  };

  const annulerModifications = () => {
    setShowConfirmModal(false);
    setModificationsResume([]);
  };

  const tabs = [
    {
      key: '0',
      title: 'Informations personnelles',
      icon: <UserIcon />,
      content: (
        <CompteInfoTab
          isDataReady={isDataReady}
          compteInfo={compteInfo}
          form={form}
          password={form.password}
          showPasswordField={true}
          editingFields={editingFields}
          abonnements={abonnements}
          grades={grades}
          status={status}
          genres={genres}
          onEditClick={handleEditClick}
          onEmailChange={handleEmailChange}
          onFormChange={handleFormChange}
          onPasswordChange={handlePasswordChange}
          onApplyChanges={handleApplyChanges}
          isLoading={updateCompte.isPending}
          formatDateForInput={formatDateForInput}
          disabledFields={disabledFields}
          canEditStatus={canEditStatus()} // Passer l'information au composant
        />
      )
    },
    {
      key: '1',
      title: 'Statistiques',
      icon: <ChartLineIcon />,
      content: (
        <StatistiquesTab
          statsDataReady={statsDataReady}
          statFrequentationForGraph={statFrequentationForGraph}
          chartType={chartType}
          onChartTypeChange={setChartType}
        />
      )
    },
    {
      key: '2',
      title: 'Paiements',
      icon: <CreditCardIcon />,
      content: (
        <PaiementsTab
          isDataReady={isDataReady}
          paiementsEcheances={paiementsEcheances}
        />
      )
    }
  ];

  if (!userData) return (
    <div className="compte-page">
      <PageHeader title="Mon compte" subtitle="Gérez vos informations personnelles et préférences" variant="compte"/>
      <PageSection className="compte-content" style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="xl" />
        <p>Chargement des informations...</p>
      </PageSection>
    </div>
  );

  if (errorCompte) return (
    <div className="compte-page">
      <PageHeader title="Mon compte" subtitle="Gérez vos informations personnelles et préférences" variant="compte"/>
      <PageSection className="compte-content">
        <Alert variant="danger" title="Erreur de chargement" isInline>
          {errorCompte?.message || 'Une erreur est survenue lors du chargement des données.'}
        </Alert>
      </PageSection>
    </div>
  );

  return (
    <div className="compte-page">
      <PageHeader title="Mon compte" subtitle="Gérez vos informations personnelles et préférences" variant="compte"/>
      <PageSection className="compte-content">
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          {tabs.map(tab => (
            <Tab
              key={tab.key}
              eventKey={tab.key}
              title={
                <>
                  {tab.icon}
                  <span style={{ marginLeft: 8 }}>{tab.title}</span>
                </>
              }
            >
              <div style={{ marginTop: '1rem' }}>{tab.content}</div>
            </Tab>
          ))}
        </Tabs>
      </PageSection>
      
      <ResumeConfirmModal
        isOpen={showConfirmModal}
        onClose={annulerModifications}
        onConfirm={confirmerModifications}
        title="Confirmer les modifications"
        message="Vous êtes sur le point de modifier vos informations."
        modificationsResume={modificationsResume}
      />
      
      <ResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title={resultModalSuccess ? 'Succès' : 'Erreur'}
        message={resultModalMessage}
        isSuccess={resultModalSuccess}
      />
    </div>
  );
};

export default Compte;



