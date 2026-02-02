import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
} from '@patternfly/react-core';
import { PageHeader } from '../../components/common/PageHeader';
import { useMonPlanningCours } from '../../hooks/useProfesseurs';
import { PlanningCoursProfesseur } from '@clubmanager/types';
import ResultModal from '../../components/common/modal/ResultModal';
import PlanningFilter from '../../components/planning/PlanningFilter';
import PlanningGrid from '../../components/planning/PlanningGrid';
import PlanningStatistics from '../../components/planning/PlanningStatistics';

const PlanningCours: React.FC = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [filtreJour, setFiltreJour] = useState<string>('tous');
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState('');
  const [resultModalSuccess, setResultModalSuccess] = useState(false);

  // Utilisation du hook pour récupérer les données
  const { data: planningData = [], isLoading: loading, error } = useMonPlanningCours();

  // Fonction utilitaire pour convertir le jour semaine en nom
  const convertirJourSemaine = (jour: number | string): string => {
    if (typeof jour === 'string') return jour;
    
    // Mapping correct : 1 = Lundi, 2 = Mardi, ..., 7 = Dimanche
    const jours = {
      1: 'Lundi',
      2: 'Mardi', 
      3: 'Mercredi',
      4: 'Jeudi',
      5: 'Vendredi',
      6: 'Samedi',
      7: 'Dimanche'
    };
    
    return jours[jour as keyof typeof jours] || 'Inconnu';
  };

  // Gérer les erreurs avec useEffect pour éviter le re-rendu infini
  useEffect(() => {
    if (error) {
      setResultModalMessage('Erreur lors du chargement du planning');
      setResultModalSuccess(false);
      setShowResultModal(true);
    }
  }, [error]);

  const coursFiltres = filtreJour === 'tous' 
    ? planningData 
    : planningData.filter(c => convertirJourSemaine(c.jour_semaine) === filtreJour);

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === 'number') {
      setActiveTabKey(tabIndex);
    }
  };

  if (loading) {
    return (
      <PageSection>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh' 
        }}>
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  return (
    <div className="planning-page">
      <PageHeader
        title="Mon Planning des Cours"
        subtitle="Consultez vos cours assignés"
        variant="planning"
      />

      <PageSection className="planning-content">
        <Tabs 
          activeKey={activeTabKey} 
          onSelect={handleTabClick}
          className="modern-tabs"
        >
          <Tab 
            eventKey={0} 
            title={<TabTitleText><span>Mes Cours</span></TabTitleText>}
          >
            <PlanningFilter
              filtreJour={filtreJour}
              onFilterSelect={setFiltreJour}
            />

            <PlanningGrid
              cours={coursFiltres}
              filtreJour={filtreJour}
            />
          </Tab>

          <Tab 
            eventKey={1} 
            title={<TabTitleText><span>Statistiques</span></TabTitleText>}
          >
            <PlanningStatistics cours={planningData} />
          </Tab>
        </Tabs>

        <ResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          title={resultModalSuccess ? 'Succès' : 'Erreur'}
          message={resultModalMessage}
          isSuccess={resultModalSuccess}
        />
      </PageSection>
    </div>
  );
};

export default PlanningCours;
