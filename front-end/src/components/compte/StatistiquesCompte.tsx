import React from 'react';
import { Alert, Spinner } from '@patternfly/react-core';
import GraphiqueLineaire from '../common/graph/GraphiqueLineaire';

interface StatistiquesCompteProps {
  statFrequentation: any;
  isLoading: boolean;
}

const StatistiquesCompte: React.FC<StatistiquesCompteProps> = ({ 
  statFrequentation, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!statFrequentation || !statFrequentation.frequentationParMois?.length) {
    return <Alert variant="info" title="Aucune statistique de fréquentation disponible." />;
  }

  const series = [
    {
      dataKey: 'frequentation',
      name: 'Présences validées',
      color: '#007bff',
    }
  ];

  return (
    <GraphiqueLineaire
      data={statFrequentation.frequentationParMois}
      series={series}
      title="Fréquentation par mois"
      xAxisKey="mois"
      xAxisLabel="Mois"
      yAxisLabel="Nombre de présences"
      type="line"
      height={400}
      showGrid={true}
      showLegend={true}
      showTooltip={true}
      cardStyle={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      formatTooltip={(value, name) => [`${value} présence${value > 1 ? 's' : ''}`, name]}
    />
  );
};

export default StatistiquesCompte;
