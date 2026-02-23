import React, { Suspense, lazy } from 'react';
import { Card, CardTitle, CardBody, Spinner } from '@patternfly/react-core';

// Lazy load le composant ChartCard avec Recharts
const ChartCardLazy = lazy(() => import('./ChartCard'));

interface ChartCardProps {
  title: string;
  data: any[];
  type: 'line' | 'pie';
  dataKey?: string;
  xAxisKey?: string;
  nameKey?: string;
  color?: string;
  height?: number;
}

/**
 * Wrapper lazy-loaded pour ChartCard
 *
 * Charge Recharts (~335KB) uniquement quand le graphique est affiché
 * Affiche un skeleton pendant le chargement
 *
 * @example
 * ```tsx
 * <ChartCard
 *   title="Évolution mensuelle"
 *   data={chartData}
 *   type="line"
 *   dataKey="value"
 *   xAxisKey="month"
 * />
 * ```
 */
export const ChartCard: React.FC<ChartCardProps> = (props) => {
  const { title, height = 300 } = props;

  // Fallback skeleton pendant le chargement de Recharts
  const ChartSkeleton = () => (
    <Card className="chart-card">
      <CardTitle className="chart-card__title">{title}</CardTitle>
      <CardBody className="chart-card__body" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" aria-label="Chargement du graphique..." />
      </CardBody>
    </Card>
  );

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartCardLazy {...props} />
    </Suspense>
  );
};

export default ChartCard;
