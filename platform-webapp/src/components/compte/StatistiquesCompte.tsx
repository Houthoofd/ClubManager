import React, { useEffect, useState } from 'react';
import {
  Spinner,
  Flex,
  FlexItem,
  Card,
  CardBody,
  Title,
  Badge
} from '@patternfly/react-core';
import GraphiqueLineaire from '../common/graph/GraphiqueLineaire';

interface StatistiquesUtilisateurProps {
  statFrequentation: any;
  isLoading: boolean;
  chartType?: 'line' | 'area' | 'bar';
}

const StatistiquesUtilisateur: React.FC<StatistiquesUtilisateurProps> = ({
  statFrequentation,
  isLoading,
  chartType = 'line',
}) => {
  const [moisData, setMoisData] = useState<any[]>([]);

  useEffect(() => {
    if (statFrequentation && Array.isArray(statFrequentation.mois)) {
      setMoisData(statFrequentation.mois);
    } else {
      setMoisData([]);
    }
  }, [statFrequentation]);

  if (isLoading || !moisData.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const series = [
    { dataKey: 'pourcentage_de_cours_valides', name: 'Taux de présence (%)', color: '#1f77b4' },
    { dataKey: 'frequentation', name: 'Nombre de présences', color: '#ff7f0e' }
  ];

  return (
    <div>
      <GraphiqueLineaire
        data={moisData}
        series={series}
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
    </div>
  );
};

export default StatistiquesUtilisateur;
