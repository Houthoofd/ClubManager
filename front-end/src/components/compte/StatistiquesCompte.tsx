import React, { useState } from 'react';
import { 
  Spinner, 
  Alert, 
  Flex, 
  FlexItem, 
  Button, 
  Card, 
  CardBody, 
  Title,
  Badge
} from '@patternfly/react-core';
import { ChartLineIcon, ChartAreaIcon, ChartBarIcon } from '@patternfly/react-icons';
import GraphiqueLineaire from '../common/graph/GraphiqueLineaire';

interface StatistiquesUtilisateurProps {
  statFrequentation: any;
  isLoading: boolean;
}

const StatistiquesUtilisateur: React.FC<StatistiquesUtilisateurProps> = ({
  statFrequentation,
  isLoading,
}) => {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Adaptation pour le format { mois: [...] }
  const moisData = Array.isArray(statFrequentation?.mois)
    ? statFrequentation.mois.map((item: any) => ({
        mois: item.mois,
        frequentation: item.frequentation,
        pourcentage_de_cours_valides: item.pourcentageCoursValides,
        nombres_total_de_cours_du_mois: item.totalCoursMois,
      }))
    : [];

  if (!moisData.length) {
    return <Alert variant="info" title="Aucune statistique de fréquentation disponible." />;
  }

  // Configuration des séries de données
  const series = [
    {
      dataKey: 'pourcentage_de_cours_valides',
      name: 'Taux de présence (%)',
      color: '#1f77b4',
    },
    {
      dataKey: 'frequentation',
      name: 'Nombre de présences',
      color: '#ff7f0e',
    }
  ];

  // Calcul des statistiques globales à partir du format { mois: [...] }
  const totalPresences = moisData.reduce(
    (acc: number, item: any) => acc + (item.frequentation ?? 0), 0
  );

  const moyenneTauxPresence = moisData.length > 0
    ? moisData.reduce(
        (acc: number, item: any) => acc + (item.pourcentage_de_cours_valides ?? 0), 0
      ) / moisData.length
    : 0;

  const meilleurMois = moisData.reduce(
    (best: any, current: any) =>
      (current.pourcentage_de_cours_valides ?? 0) > (best?.pourcentage_de_cours_valides ?? 0)
        ? current
        : best,
    null
  );

  return (
    <div>
      {/* Cartes de statistiques globales */}
      <div style={{ marginBottom: '2rem' }}>
        <Title headingLevel="h3" style={{ marginBottom: '1rem' }}>
          Résumé des statistiques
        </Title>
        <Flex spaceItems={{ default: 'spaceItemsLg' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card style={{ textAlign: 'center', padding: '1rem' }}>
              <CardBody>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f77b4' }}>
                  {totalPresences}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Présences totales
                </div>
              </CardBody>
            </Card>
          </FlexItem>
          
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card style={{ textAlign: 'center', padding: '1rem' }}>
              <CardBody>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff7f0e' }}>
                  {moyenneTauxPresence.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Taux de présence moyen
                </div>
              </CardBody>
            </Card>
          </FlexItem>
          
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card style={{ textAlign: 'center', padding: '1rem' }}>
              <CardBody>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2ca02c' }}>
                  {meilleurMois?.mois || 'N/A'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Meilleur mois
                </div>
                {meilleurMois && (
                  <Badge style={{ marginTop: '0.5rem', backgroundColor: '#2ca02c', color: 'white' }}>
                    {meilleurMois.pourcentage_de_cours_valides}%
                  </Badge>
                )}
              </CardBody>
            </Card>
          </FlexItem>
        </Flex>
      </div>

      {/* Contrôles du graphique */}
      <div style={{ marginBottom: '1rem' }}>
        <Title headingLevel="h3" style={{ marginBottom: '1rem' }}>
          Évolution de la fréquentation
        </Title>
        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <span style={{ marginRight: '1rem', fontWeight: '500' }}>Type de graphique :</span>
          </FlexItem>
          <FlexItem>
            <Button
              variant={chartType === 'line' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setChartType('line')}
              icon={<ChartLineIcon />}
            >
              Ligne
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              variant={chartType === 'area' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setChartType('area')}
              icon={<ChartAreaIcon />}
            >
              Aire
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              variant={chartType === 'bar' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setChartType('bar')}
              icon={<ChartBarIcon />}
            >
              Barres
            </Button>
          </FlexItem>
        </Flex>
      </div>

      {/* Graphique principal */}
      <GraphiqueLineaire
        data={moisData}
        series={series}
        xAxisKey="mois"
        xAxisLabel="Mois"
        yAxisLabel="Valeurs"
        type={chartType}
        height={450}
        showGrid={true}
        showLegend={true}
        showTooltip={true}
        gradientColors={chartType === 'area'}
        cardStyle={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        formatTooltip={(value, name) => {
          if (name.includes('%')) {
            return [`${value}%`, name];
          }
          return [`${value} présence${value > 1 ? 's' : ''}`, name];
        }}
      />

      {/* Détails par mois */}
      <div style={{ marginTop: '2rem' }}>
        <Title headingLevel="h4" style={{ marginBottom: '1rem' }}>
          Détail par mois
        </Title>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '1rem' 
        }}>
          {statFrequentation.frequentationParMois?.map((item: any, index: number) => (
            <Card key={index} style={{ padding: '0.75rem' }}>
              <CardBody>
                <Title headingLevel="h5" size="md" style={{ marginBottom: '0.5rem' }}>
                  {item.mois}
                </Title>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <span style={{ fontWeight: '500' }}>Présences : </span>
                    <Badge style={{ backgroundColor: '#ff7f0e', color: 'white' }}>
                      {item.frequentation}
                    </Badge>
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
  );
};

export default StatistiquesUtilisateur;
