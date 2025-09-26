import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  PageSection,
  Spinner,
  Alert,
  FormSelect,
  FormSelectOption
} from '@patternfly/react-core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { TabContainer } from '../components/common/TabContainer';
import { UserIcon, ChartLineIcon, CreditCardIcon } from '@patternfly/react-icons';
import {
  useCompteInfo,
  useUpdateCompte,
  useAbonnements,
  useGrades,
  useStatus,
  useGenres
} from '../hooks/useCompte';
import { useFrequentationByUserId } from '../hooks/useStatistiques';
import FormulaireCompte from '../components/compte/FormulaireCompte';
import StatistiquesUtilisateur from '../components/utilisateurs/StatistiquesUtilisateur';
import ModalsCompte from '../components/compte/ModalsCompte';
import EcheancesPaiement from '../components/utilisateurs/EcheancesPaiement';
import { useEcheancesByUserId } from '../hooks/usePaiements';

function formatDateForInput(isoDateString: string): string {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Compte = () => {
  // 1. États initiaux
  const { id } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [form, setForm] = useState({
    email: '',
    date_naissance: '',
    genres: '',
    grades: '',
    abonnement: '',
    status: ''
  });
  const [userData, setUserData] = useState<any | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [isLocalStorageChecked, setIsLocalStorageChecked] = useState(false);

  // 2. Récupération des données utilisateur depuis localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
        setIsUserDataLoaded(true);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
      }
    }
    setIsLocalStorageChecked(true);
  }, []);

  // Les hooks doivent être appelés à chaque render, même si userData n'est pas prêt
  const { data: compteInfo, isLoading: loadingCompte, error: errorCompte } = useCompteInfo(
    isUserDataLoaded ? userData?.first_name : null,
    isUserDataLoaded ? userData?.last_name : null
  );
  const { data: statFrequentation, isLoading: loadingStats } = useFrequentationByUserId(
    isUserDataLoaded ? userData?.id : null
  );
  const { data: paiementsEcheances = [] } = useEcheancesByUserId(
    isUserDataLoaded ? userData?.id : null
  );
  const updateCompte = useUpdateCompte();
  const { data: abonnements = [] } = useAbonnements();
  const { data: grades = [] } = useGrades();
  const { data: status = [] } = useStatus();
  const { data: genres = [] } = useGenres();

  // 4. Effets secondaires - appelés uniquement quand les données nécessaires sont disponibles
  useEffect(() => {
    if (compteInfo && !compteInfo.mot_de_passe) {
      setShowPasswordField(true);
    } else if (compteInfo) {
      setShowPasswordField(false);
    }
  }, [compteInfo]);

  useEffect(() => {
    if (compteInfo) {
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

  console.log('Statistiques:', statFrequentation, 'Utilisateur:', userData?.first_name, userData?.last_name, 'Compte:', compteInfo);

  // 6. Gestionnaires d'événements
  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
    setActiveTabKey(Number(eventKey));
  };

  const handleEditClick = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailChange = (value: string) => {
    setForm(prev => ({ ...prev, email: value }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const getChangesSummary = () => {
    const changes: { [key: string]: string } = {};
    Object.keys(editingFields).forEach(field => {
      if (editingFields[field]) {
        changes[field] = (form as any)[field];
      }
    });
    return changes;
  };

  const handleApplyChanges = () => {
    const changes = getChangesSummary();
    if (showPasswordField && password) {
      changes['mot_de_passe'] = password;
    }

    const changesList = Object.entries(changes)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('\n');

    setModalMessage(
      Object.keys(changes).length > 0
        ? `Les modifications suivantes seront appliquées :\n\n${changesList}`
        : 'Aucun changement détecté.'
    );

    setIsModalOpen(true);

    if (Object.keys(changes).length > 0) {
      updateCompte.mutate({ id, ...changes });
    }
  };

  // 5. Déclaration des tabs - après toutes les déclarations de données et gestionnaires
  const tabs = [
    {
      key: 0,
      title: 'Informations personnelles',
      icon: <UserIcon />,
      content: (
        <FormulaireCompte
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
        />
      )
    },
    {
      key: 1,
      title: 'Statistiques',
      icon: <ChartLineIcon />,
      content: (
        !statFrequentation
          ? <Spinner size="lg" />
          : <StatistiquesUtilisateur
              statFrequentation={statFrequentation}
              isLoading={loadingStats}
            />
      )
    },
    {
      key: 2,
      title: 'Paiements',
      icon: <CreditCardIcon />,
      content: (
        <EcheancesPaiement paiementsEcheances={paiementsEcheances} />
      )
    }
  ];

  // 7. Fonctions de rendu
  const renderLoading = () => (
    <div className="compte-page">
      <PageHeader
        title="Mon compte"
        subtitle="Gérez vos informations personnelles et préférences"
        variant="compte"
      />
      <PageSection className="compte-content">
        <div className="loading-container">
          <Spinner size="xl" />
          <p>Chargement des informations...</p>
        </div>
      </PageSection>
    </div>
  );

  const renderError = () => (
    <div className="compte-page">
      <PageHeader
        title="Mon compte"
        subtitle="Gérez vos informations personnelles et préférences"
        variant="compte"
      />
      <PageSection className="compte-content">
        <Alert variant="danger" title="Erreur de chargement" isInline>
          {errorCompte?.message}
        </Alert>
        <TabContainer
          tabs={tabs}
          activeKey={activeTabKey}
          onTabSelect={handleTabClick}
          variant="modern"
        />
      </PageSection>
      <ModalsCompte
        isModalOpen={isModalOpen}
        modalMessage={modalMessage}
        onCloseModal={() => setIsModalOpen(false)}
      />
    </div>
  );

  const renderMainContent = () => (
    <div className="compte-page">
      <PageHeader
        title="Mon compte"
        subtitle="Gérez vos informations personnelles et préférences"
        variant="compte"
      />
      <PageSection className="compte-content">
        <TabContainer
          tabs={tabs}
          activeKey={activeTabKey}
          onTabSelect={handleTabClick}
          variant="modern"
        />
      </PageSection>
      <ModalsCompte
        isModalOpen={isModalOpen}
        modalMessage={modalMessage}
        onCloseModal={() => setIsModalOpen(false)}
      />
    </div>
  );

  // 8. Logique de rendu conditionnel
  if (loadingCompte && !compteInfo) {
    return renderLoading();
  }

  if (errorCompte && !(compteInfo && userData)) {
    return renderError();
  }

  // Ajout : attendre que les données principales soient chargées avant de rendre la page
  if (!compteInfo || !userData) {
    return (
      <div className="compte-page">
        <PageHeader
          title="Mon compte"
          subtitle="Gérez vos informations personnelles et préférences"
          variant="compte"
        />
        <PageSection className="compte-content">
          <Spinner size="xl" />
          <p>Chargement des informations du compte...</p>
        </PageSection>
      </div>
    );
  }

  return renderMainContent();
};


export default Compte;
