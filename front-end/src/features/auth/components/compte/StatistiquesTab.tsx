import React, { useState } from 'react';
import { Spinner, Button } from '@patternfly/react-core';
import { ChevronDownIcon, ChevronRightIcon } from '@/shared/icons';
import StatistiquesResume from './StatistiquesResume';
import StatistiquesGraphique from './StatistiquesGraphique';
import StatistiquesDetail from './StatistiquesDetail';

interface StatistiquesTabProps {
  statsDataReady: boolean;
  statFrequentationForGraph: any;
  chartType: 'line' | 'area' | 'bar';
  onChartTypeChange: (type: 'line' | 'area' | 'bar') => void;
}

const StatistiquesTab: React.FC<StatistiquesTabProps> = ({
  statsDataReady,
  statFrequentationForGraph,
  chartType,
  onChartTypeChange,
}) => {
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  if (!statsDataReady || !statFrequentationForGraph) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div>
      <StatistiquesResume statFrequentationForGraph={statFrequentationForGraph} />
      <StatistiquesGraphique
        statFrequentationForGraph={statFrequentationForGraph}
        chartType={chartType}
        onChartTypeChange={onChartTypeChange}
      />
      
      {/* Section expandable pour les détails par mois */}
      <div style={{ marginTop: '2rem' }}>
        <Button
          variant="link"
          onClick={() => setIsDetailExpanded(!isDetailExpanded)}
          style={{
            padding: '0.5rem 0',
            fontSize: '1.1rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {isDetailExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          Détail par mois
        </Button>
        
        {isDetailExpanded && (
          <div style={{ marginTop: '1rem' }}>
            <StatistiquesDetail statFrequentationForGraph={statFrequentationForGraph} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatistiquesTab;
