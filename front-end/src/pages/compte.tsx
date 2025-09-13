import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  PageSection,
  Title,
  Spinner,
  Alert,
} from '@patternfly/react-core';
import { useParams } from 'react-router-dom';
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
  const { id } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
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

  // Hooks React Query
  const { data: compteInfo, isLoading: loadingCompte, error: errorCompte } = useCompteInfo(userData?.prenom, userData?.nom);
  const { data: statFrequentation, isLoading: loadingStats } = useFrequentationByUserId(userData?.id);
  const { data: paiementsEcheances = [] } = useEcheancesByUserId(userData?.id);
  const updateCompte = useUpdateCompte();
  const abonnementsQuery = useAbonnements();
  const gradesQuery = useGrades();
  const statusQuery = useStatus();
  const genresQuery = useGenres();

  // Récupère prénom et nom depuis localStorage
  React.useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setUserData(parsedData.data);
    }
  }, []);

  // Utilise le hook useCompteInfo avec prénom et nom
  React.useEffect(() => {
    if (compteInfo && !compteInfo.mot_de_passe) {
      setShowPasswordField(true);
    } else {
      setShowPasswordField(false);
    }
  }, [compteInfo]);

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
    setPendingChanges(changes);
    
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

  if (loadingCompte) return <Spinner size="xl" />;
  if (errorCompte) return <Alert variant="danger" title={errorCompte.message} />;

  return (
    <PageSection>
      <Title headingLevel="h1" size="xl" style={{ marginBottom: '1rem' }}>
        Mon compte
      </Title>
      
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
          <FormulaireCompte
            compteInfo={compteInfo}
            form={form}
            password={password}
            showPasswordField={showPasswordField}
            editingFields={editingFields}
            abonnements={abonnementsQuery.data || []}
            grades={gradesQuery.data || []}
            status={statusQuery.data || []}
            genres={genresQuery.data || []}
            onEditClick={handleEditClick}
            onEmailChange={handleEmailChange}
            onFormChange={handleFormChange}
            onPasswordChange={handlePasswordChange}
            onApplyChanges={handleApplyChanges}
            isLoading={updateCompte.isPending}
            formatDateForInput={formatDateForInput}
          />
        </Tab>
        
        <Tab eventKey={1} title={<TabTitleText>Statistiques</TabTitleText>}>
          <StatistiquesUtilisateur
            statFrequentation={statFrequentation}
            isLoading={loadingStats}
          />
        </Tab>

        <Tab eventKey={2} title={<TabTitleText>Paiements</TabTitleText>}>
          <EcheancesPaiement paiementsEcheances={paiementsEcheances} />
        </Tab>
      </Tabs>

      <ModalsCompte
        isModalOpen={isModalOpen}
        modalMessage={modalMessage}
        onCloseModal={() => setIsModalOpen(false)}
      />
    </PageSection>
  );
};

export default Compte;
