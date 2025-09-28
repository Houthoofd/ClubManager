import React, { useState, useEffect } from 'react';
import { PageSection, Spinner, Alert, Tabs, Tab } from '@patternfly/react-core';
import { PageHeader } from '../components/common/PageHeader';
import { UserIcon, ChartLineIcon, CreditCardIcon } from '@patternfly/react-icons';
import { useCompteData } from '../hooks/useCompteData';
import CompteInfoTab from '../components/compte/CompteInfoTab';
import StatistiquesTab from '../components/compte/StatistiquesTab';
import PaiementsTab from '../components/compte/PaiementsTab';
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
    status: ''
  });
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [disabledFields, setDisabledFields] = useState<{ [key: string]: boolean }>({});

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
      });
    }
  }, [compteInfo]);

  // handlers
  const handleTabClick = (_event: React.SyntheticEvent, eventKey: string | number) => {
    setActiveTabKey(String(eventKey));
  };

  const handleEditClick = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailChange = (value: string) => setForm(prev => ({ ...prev, email: value }));
  const handlePasswordChange = (value: string) => setPassword(value);

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
    if (showPasswordField && password) changes['mot_de_passe'] = password;

    console.log('=== DEBUG handleApplyChanges ===');
    console.log('Changes:', changes);
    console.log('CompteInfo:', compteInfo);
    console.log('CompteInfo.utilisateur:', compteInfo?.utilisateur);
    console.log('Genres array:', genres);

    if (Object.keys(changes).length > 0) {
      const modifications: ModificationItem[] = Object.entries(changes)
        .map(([key, newValue]) => {
          console.log(`\n--- Processing field: ${key} ---`);
          
          // Récupérer la valeur originale depuis compteInfo.utilisateur
          let originalValue = compteInfo?.utilisateur?.[key];
          console.log(`Original value from compteInfo.utilisateur[${key}]:`, originalValue);
          console.log(`New value:`, newValue);
          
          // Obtenir les noms d'affichage avec fallback
          let originalDisplay = 'Non défini';
          let newDisplay = String(newValue || 'Vide');
          
          // Conversion des valeurs originales - seulement si on a une vraie valeur
          if (originalValue && originalValue !== '' && originalValue !== null) {
            console.log(`Processing original value: ${originalValue}`);
            
            if (key === 'genres' && genres) {
              console.log('Looking for genre with name:', originalValue);
              // Chercher par nom d'abord, puis par ID
              let genre = genres.find(g => g.genre_name === originalValue);
              if (!genre) {
                genre = genres.find(g => String(g.id) === String(originalValue));
              }
              console.log('Found genre:', genre);
              originalDisplay = genre?.genre_name || `Genre: ${originalValue}`;
            } else if (key === 'grades' && grades) {
              console.log('Looking for grade with name:', originalValue);
              let grade = grades.find(g => g.grade_id === originalValue);
              if (!grade) {
                grade = grades.find(g => String(g.id) === String(originalValue));
              }
              console.log('Found grade:', grade);
              originalDisplay = grade?.grade_id || `Grade: ${originalValue}`;
            } else if (key === 'abonnement' && abonnements) {
              console.log('Looking for abonnement with name:', originalValue);
              let abonnement = abonnements.find(a => a.nom_plan === originalValue);
              if (!abonnement) {
                abonnement = abonnements.find(a => String(a.id) === String(originalValue));
              }
              console.log('Found abonnement:', abonnement);
              originalDisplay = abonnement?.nom_plan || `Abonnement: ${originalValue}`;
            } else if (key === 'status' && status) {
              console.log('Looking for status with name:', originalValue);
              let statusItem = status.find(s => s.nom_status === originalValue);
              if (!statusItem) {
                statusItem = status.find(s => String(s.id) === String(originalValue));
              }
              console.log('Found status:', statusItem);
              originalDisplay = statusItem?.nom_status || `Status: ${originalValue}`;
            } else if (key === 'mot_de_passe') {
              originalDisplay = 'Mot de passe existant';
            } else {
              originalDisplay = String(originalValue);
            }
          }
          
          // Conversion des nouvelles valeurs
          if (newValue && newValue !== '') {
            console.log(`Processing new value: ${newValue}`);
            
            if (key === 'genres' && genres) {
              console.log('Looking for new genre with name:', newValue);
              // La nouvelle valeur peut être le nom du genre directement
              let genre = genres.find(g => g.genre_name === newValue);
              if (!genre) {
                genre = genres.find(g => String(g.id) === String(newValue));
              }
              console.log('Found new genre:', genre);
              newDisplay = genre?.genre_name || newValue;
            } else if (key === 'grades' && grades) {
              console.log('Looking for new grade with name:', newValue);
              let grade = grades.find(g => g.grade_id === newValue);
              if (!grade) {
                grade = grades.find(g => String(g.id) === String(newValue));
              }
              console.log('Found new grade:', grade);
              newDisplay = grade?.grade_id || newValue;
            } else if (key === 'abonnement' && abonnements) {
              console.log('Looking for new abonnement with name:', newValue);
              let abonnement = abonnements.find(a => a.nom_plan === newValue);
              if (!abonnement) {
                abonnement = abonnements.find(a => String(a.id) === String(newValue));
              }
              console.log('Found new abonnement:', abonnement);
              newDisplay = abonnement?.nom_plan || newValue;
            } else if (key === 'status' && status) {
              console.log('Looking for new status with name:', newValue);
              let statusItem = status.find(s => s.nom_status === newValue);
              if (!statusItem) {
                statusItem = status.find(s => String(s.id) === String(newValue));
              }
              console.log('Found new status:', statusItem);
              newDisplay = statusItem?.nom_status || newValue;
            } else if (key === 'mot_de_passe') {
              newDisplay = 'Nouveau mot de passe';
            } else {
              newDisplay = String(newValue);
            }
          }
          
          console.log(`Final display values - Original: "${originalDisplay}", New: "${newDisplay}"`);
          
          return {
            field: key,
            oldValue: originalDisplay,
            newValue: newDisplay
          };
        });
      
      console.log('Final modifications array:', modifications);
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
    if (showPasswordField && password) changes['mot_de_passe'] = password;

    const changesToSend = { id: utilisateurId, ...changes };
    
    // Nettoie les champs vides
    Object.keys(changesToSend).forEach(key => {
      if (
        key !== 'id' &&
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
          password={password}
          showPasswordField={showPasswordField}
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


