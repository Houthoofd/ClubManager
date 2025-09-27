import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Spinner,
  Alert,
  Tabs,
  Tab,
  Flex,
  FlexItem,
  Card,
  CardBody,
  Title,
  Badge
} from '@patternfly/react-core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
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
import ModalsCompte from '../components/compte/ModalsCompte';
import EcheancesPaiement from '../components/utilisateurs/EcheancesPaiement';
import { useEcheancesByUserId } from '../hooks/usePaiements';
import GraphiqueLineaire from '../components/common/graph/GraphiqueLineaire';

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
  const [activeTabKey, setActiveTabKey] = useState<string>('0');
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
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
  const [isDataReady, setIsDataReady] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  // Correction : ajoute l'état disabledFields
  const [disabledFields, setDisabledFields] = useState<{ [key: string]: boolean }>({});
  // Ajoute l'état pour gérer l'étape de la modal et les changements en attente
  const [modalStep, setModalStep] = useState<'summary' | 'result'>('summary');
  const [pendingChanges, setPendingChanges] = useState<any | null>(null);

  // récupération userData depuis localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
      } catch (error) {
        console.error('Erreur parsing localStorage:', error);
      }
    }
  }, []);

  // hooks React Query
  // Correction : utilise l'id de l'utilisateur pour les hooks
  const utilisateurId = userData?.id || id || null;

  const { data: compteInfo, isLoading: loadingCompte, error: errorCompte } = useCompteInfo(
    userData?.first_name || null,
    userData?.last_name || null
  );

  const { data: statFrequentation, isLoading: loadingStats } = useFrequentationByUserId(
    utilisateurId
  );

  const { data: paiementsEcheances = [] } = useEcheancesByUserId(utilisateurId);
  const updateCompte = useUpdateCompte();
  const { data: abonnements = [] } = useAbonnements();
  const { data: grades = [] } = useGrades();
  const { data: status = [] } = useStatus();
  const { data: genres = [] } = useGenres();

  // data ready ?
  useEffect(() => {
    if (compteInfo && userData && !loadingCompte) {
      setIsDataReady(true);
    }
  }, [compteInfo, userData, loadingCompte]);

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

  // Correction : affiche le résultat de la mutation dans la même modal
  useEffect(() => {
    if (modalStep === 'result') {
      if (updateCompte.isSuccess) {
        setModalMessage('Modification réussie !');
        // Désactive les champs modifiés
        if (pendingChanges) {
          const newDisabled: { [key: string]: boolean } = {};
          Object.keys(pendingChanges).forEach(field => {
            if (field !== 'id' && field !== 'mot_de_passe') newDisabled[field] = true;
          });
          setDisabledFields(prev => ({ ...prev, ...newDisabled }));
        }
      }
      if (updateCompte.isError) {
        setModalMessage(updateCompte.error?.message || 'Échec de la modification.');
      }
    }
  }, [updateCompte.isSuccess, updateCompte.isError, updateCompte.error, modalStep, pendingChanges]);

  // Affiche le résumé des changements dans la modal avant modification
  const handleApplyChanges = () => {
    const changes = getChangesSummary();
    if (showPasswordField && password) changes['mot_de_passe'] = password;

    const changesList = Object.entries(changes)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('\n');

    setModalMessage(
      Object.keys(changes).length > 0
        ? `Les modifications suivantes seront appliquées :\n\n${changesList}\n\nConfirmer la modification ?`
        : 'Aucun changement détecté.'
    );
    setIsModalOpen(true);
    setModalStep('summary');
    setPendingChanges(Object.keys(changes).length > 0 ? { id: utilisateurId, ...changes } : null);
  };

  // Handler pour confirmer la modification depuis la modal
  const handleConfirmModal = () => {
    if (pendingChanges && !updateCompte.isPending) {
      // Correction : retire les champs vides ou non modifiés avant mutation
      const changesToSend = { ...pendingChanges };
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
      setModalStep('result');
    }
  };

  // Handler pour fermer la modal (réinitialise pendingChanges et l'étape)
  const handleCloseModal = () => {
    // Si on est à l'étape de résumé, lancer la mutation avant de fermer
    if (pendingChanges && modalStep === 'summary') {
      const changesToSend = { ...pendingChanges };
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
      setModalStep('result');
      // Ne ferme pas la modal tout de suite, laisse le résultat s'afficher
      return;
    }
    // Sinon, ferme la modal normalement
    setIsModalOpen(false);
    setPendingChanges(null);
    setModalStep('summary');
  };

  // Transformation des données pour GraphiqueLineaire
  const statsDataReady =
    statFrequentation &&
    Array.isArray(statFrequentation.mois) &&
    statFrequentation.mois.length > 0;

  const statFrequentationForGraph = statsDataReady
    ? {
        ...statFrequentation,
        mois: statFrequentation.mois.map((item: any) => ({
          mois: item.mois,
          frequentation: item.frequentation,
          pourcentage_de_cours_valides: item.pourcentageCoursValides,
          nombres_total_de_cours_du_mois: item.totalCoursMois,
        }))
      }
    : undefined;

  const tabs = [
    {
      key: '0',
      title: 'Informations personnelles',
      icon: <UserIcon />,
      content: isDataReady ? (
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
          disabledFields={disabledFields} // <-- Ajout ici
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="md" />
        </div>
      )
    },
    {
      key: '1',
      title: 'Statistiques',
      icon: <ChartLineIcon />,
      content: statsDataReady ? (
        <div>
          {/* Résumé global */}
          <div style={{ marginBottom: '2rem' }}>
            <Title headingLevel="h3" style={{ marginBottom: '1rem' }}>Résumé des statistiques</Title>
            <Flex spaceItems={{ default: 'spaceItemsLg' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Card style={{ textAlign: 'center', padding: '1rem' }}>
                  <CardBody>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f77b4' }}>
                      {statFrequentationForGraph!.mois.reduce((acc, item) => acc + (item.frequentation ?? 0), 0)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Présences totales</div>
                  </CardBody>
                </Card>
              </FlexItem>

              <FlexItem flex={{ default: 'flex_1' }}>
                <Card style={{ textAlign: 'center', padding: '1rem' }}>
                  <CardBody>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff7f0e' }}>
                      {(statFrequentationForGraph!.mois.reduce((acc, item) => acc + (item.pourcentage_de_cours_valides ?? 0), 0) / statFrequentationForGraph!.mois.length).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Taux de présence moyen</div>
                  </CardBody>
                </Card>
              </FlexItem>

              <FlexItem flex={{ default: 'flex_1' }}>
                <Card style={{ textAlign: 'center', padding: '1rem' }}>
                  <CardBody>
                    {(() => {
                      const best = statFrequentationForGraph!.mois.reduce(
                        (best, current) => (current.pourcentage_de_cours_valides ?? 0) > (best?.pourcentage_de_cours_valides ?? 0) ? current : best,
                        null
                      );
                      return (
                        <>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2ca02c' }}>
                            {best?.mois || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>Meilleur mois</div>
                          {best && (
                            <Badge style={{ marginTop: '0.5rem', backgroundColor: '#2ca02c', color: 'white' }}>
                              {best.pourcentage_de_cours_valides}%
                            </Badge>
                          )}
                        </>
                      )
                    })()}
                  </CardBody>
                </Card>
              </FlexItem>
            </Flex>
          </div>

          {/* Contrôles du graphique */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setChartType('line')} style={{ padding: '0.5rem 1rem', borderRadius: 4, border: 'none', backgroundColor: chartType==='line'?'#1f77b4':'#ccc', color:'white' }}>Ligne</button>
            <button onClick={() => setChartType('area')} style={{ padding: '0.5rem 1rem', borderRadius: 4, border: 'none', backgroundColor: chartType==='area'?'#1f77b4':'#ccc', color:'white' }}>Aire</button>
            <button onClick={() => setChartType('bar')} style={{ padding: '0.5rem 1rem', borderRadius: 4, border: 'none', backgroundColor: chartType==='bar'?'#1f77b4':'#ccc', color:'white' }}>Barres</button>
          </div>

          {/* Graphique */}
          <GraphiqueLineaire
            data={statFrequentationForGraph!.mois}
            series={[
              { dataKey: 'pourcentage_de_cours_valides', name: 'Taux de présence (%)', color: '#1f77b4' },
              { dataKey: 'frequentation', name: 'Nombre de présences', color: '#ff7f0e' }
            ]}
            xAxisKey="mois"
            xAxisLabel="Mois"
            yAxisLabel="Valeurs"
            type={chartType}
            height={450}
            showGrid
            showLegend
            showTooltip
            gradientColors={chartType === 'area'}
            cardStyle={{ border: '1px solid #dee2e6', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            formatTooltip={(value, name) => name.includes('%') ? [`${value}%`, name] : [`${value} présence${value > 1 ? 's' : ''}`, name]}
          />

          {/* Détail par mois */}
          <div style={{ marginTop: '2rem' }}>
            <Title headingLevel="h4" style={{ marginBottom: '1rem' }}>Détail par mois</Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {statFrequentationForGraph!.mois.map((item, index) => (
                <Card key={index} style={{ padding: '0.75rem' }}>
                  <CardBody>
                    <Title headingLevel="h5" size="md" style={{ marginBottom: '0.5rem' }}>{item.mois}</Title>
                    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                      <FlexItem>
                        <span style={{ fontWeight: '500' }}>Présences : </span>
                        <Badge style={{ backgroundColor: '#ff7f0e', color: 'white' }}>{item.frequentation}</Badge>
                      </FlexItem>
                      <FlexItem>
                        <span style={{ fontWeight: '500' }}>Taux : </span>
                        <Badge style={{
                          backgroundColor: item.pourcentage_de_cours_valides >= 80 ? '#28a745' :
                            item.pourcentage_de_cours_valides >= 60 ? '#ffc107' : '#dc3545',
                          color: 'white'
                        }}>
                          {item.pourcentage_de_cours_valides}%
                        </Badge>
                      </FlexItem>
                      <FlexItem>
                        <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#666' }}>
                          Cours total : {item.nombres_total_de_cours_du_mois}
                        </span>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="md" />
        </div>
      )
    },
    {
      key: '2',
      title: 'Paiements',
      icon: <CreditCardIcon />,
      content: isDataReady ? (
        <EcheancesPaiement paiementsEcheances={paiementsEcheances} />
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="md" />
        </div>
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
                  {/* Correction : utilise tab.icon comme composant, pas comme balise JSX */}
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
      <ModalsCompte
        isModalOpen={isModalOpen}
        modalMessage={modalMessage}
        onCloseModal={handleCloseModal}
        onConfirm={pendingChanges && modalStep === 'summary' ? handleConfirmModal : undefined}
      />
    </div>
  );
};

export default Compte;

