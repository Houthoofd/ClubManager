import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  Flex, 
  FlexItem, 
  Badge, 
  Button
} from '@patternfly/react-core';
import { ChevronDownIcon, ChevronRightIcon } from '@/shared/icons';

interface StatistiquesDetailProps {
  statFrequentationForGraph: any;
}

const StatistiquesDetail: React.FC<StatistiquesDetailProps> = ({
  statFrequentationForGraph,
}) => {
  const [expandedMonths, setExpandedMonths] = useState<{ [key: string]: boolean }>({});

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  // Fonction pour traduire les mois en français
  const translateMonth = (month: string): string => {
    const monthTranslations: { [key: string]: string } = {
      'January': 'Janvier',
      'February': 'Février',
      'March': 'Mars',
      'April': 'Avril',
      'May': 'Mai',
      'June': 'Juin',
      'July': 'Juillet',
      'August': 'Août',
      'September': 'Septembre',
      'October': 'Octobre',
      'November': 'Novembre',
      'December': 'Décembre'
    };
    return monthTranslations[month] || month;
  };

  // Vérification de sécurité pour les données
  if (!statFrequentationForGraph || !statFrequentationForGraph.mois || !Array.isArray(statFrequentationForGraph.mois)) {
    return <p>Aucune donnée disponible</p>;
  }

  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '0.5rem',
      width: '100%'
    }}>
      {statFrequentationForGraph.mois.map((item, index) => {
        const monthKey = `month-${index}`;
        const isExpanded = expandedMonths[monthKey] || false;
        const translatedMonth = translateMonth(item?.mois || `Mois ${index + 1}`);
        
        return (
          <Card key={index} style={{ padding: '0.5rem', width: '100%' }}>
            <div>
              <Button
                variant="plain"
                onClick={() => toggleMonth(monthKey)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontWeight: '500' }}>
                  {translatedMonth}
                </span>
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </Button>
              
              {isExpanded && (
                <CardBody style={{ paddingTop: '1rem' }}>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <span style={{ fontWeight: '500' }}>Présences : </span>
                          <Badge style={{ backgroundColor: '#ff7f0e', color: 'white' }}>
                            {item?.frequentation || 0}
                          </Badge>
                        </FlexItem>
                        <FlexItem>
                          <span style={{ fontWeight: '500' }}>Taux : </span>
                          <Badge style={{
                            backgroundColor: (item?.pourcentage_de_cours_valides || 0) >= 80 ? '#28a745' :
                              (item?.pourcentage_de_cours_valides || 0) >= 60 ? '#ffc107' : '#dc3545',
                            color: 'white'
                          }}>
                            {item?.pourcentage_de_cours_valides || 0}%
                          </Badge>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#666' }}>
                        Cours total : {item?.nombres_total_de_cours_du_mois || 0}
                      </span>
                    </FlexItem>
                    <FlexItem style={{ marginTop: '0.5rem' }}>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#495057',
                        padding: '0.5rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px'
                      }}>
                        <strong>Analyse :</strong> 
                        {(item?.pourcentage_de_cours_valides || 0) >= 80 
                          ? ' Excellente assiduité ce mois-ci !' 
                          : (item?.pourcentage_de_cours_valides || 0) >= 60
                          ? ' Bonne participation, continuez ainsi.'
                          : ' Amélioration possible sur la régularité.'}
                      </div>
                    </FlexItem>
                  </Flex>
                </CardBody>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default StatistiquesDetail;

