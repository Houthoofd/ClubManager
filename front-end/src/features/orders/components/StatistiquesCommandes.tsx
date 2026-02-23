import React from 'react';
import {
  Card,
  CardBody,
  Grid,
  GridItem,
  Title,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { 
  ShoppingCartIcon, 
  CheckCircleIcon, 
  TruckIcon, 
  TimesCircleIcon,
  DollarSignIcon 
} from '@/shared/icons';

interface StatistiquesCommandesProps {
  commandes: any[];
}

const StatistiquesCommandes: React.FC<StatistiquesCommandesProps> = ({ commandes }) => {
  // Calculer les statistiques à partir des commandes
  const stats = React.useMemo(() => {
    const total = commandes.length;
    const enAttente = commandes.filter(c => c.statut === 'en_attente').length;
    const confirmees = commandes.filter(c => c.statut === 'confirmee').length;
    const livrees = commandes.filter(c => c.statut === 'livree').length;
    const annulees = commandes.filter(c => c.statut === 'annulee').length;
    
    const chiffreAffairesTotal = commandes
      .filter(c => c.statut !== 'annulee')
      .reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    
    const chiffreAffairesMois = commandes
      .filter(c => {
        const dateCommande = new Date(c.date_commande);
        return dateCommande >= debutMois && c.statut !== 'annulee';
      })
      .reduce((sum, c) => sum + parseFloat(c.total || 0), 0);

    return {
      total,
      enAttente,
      confirmees,
      livrees,
      annulees,
      chiffreAffairesTotal,
      chiffreAffairesMois
    };
  }, [commandes]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card style={{ height: '100%' }}>
      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <div style={{ 
                  color, 
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {icon}
                </div>
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h4" size="md" style={{ margin: 0, color: '#495057' }}>
                  {title}
                </Title>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#2c3e50',
              lineHeight: 1
            }}>
              {value}
            </div>
            {subtitle && (
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#7f8c8d',
                marginTop: '0.25rem'
              }}>
                {subtitle}
              </div>
            )}
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );

  return (
    <div style={{ marginBottom: '2rem' }}>
      <Title headingLevel="h3" style={{ marginBottom: '1rem', color: '#495057' }}>
        📊 Statistiques des commandes
      </Title>
      
      <Grid hasGutter>
        <GridItem span={4} md={2}>
          <StatCard
            title="Total"
            value={stats.total}
            icon={<ShoppingCartIcon />}
            color="#3498db"
          />
        </GridItem>
        
        <GridItem span={4} md={2}>
          <StatCard
            title="En attente"
            value={stats.enAttente}
            icon={<TimesCircleIcon />}
            color="#f39c12"
          />
        </GridItem>
        
        <GridItem span={4} md={2}>
          <StatCard
            title="Confirmées"
            value={stats.confirmees}
            icon={<CheckCircleIcon />}
            color="#2ecc71"
          />
        </GridItem>
        
        <GridItem span={4} md={2}>
          <StatCard
            title="Livrées"
            value={stats.livrees}
            icon={<TruckIcon />}
            color="#27ae60"
          />
        </GridItem>
        
        <GridItem span={4} md={2}>
          <StatCard
            title="Annulées"
            value={stats.annulees}
            icon={<TimesCircleIcon />}
            color="#e74c3c"
          />
        </GridItem>
        
        <GridItem span={8} md={2}>
          <StatCard
            title="Chiffre d'affaires"
            value={`${stats.chiffreAffairesTotal.toFixed(2)} €`}
            icon={<DollarSignIcon />}
            color="#9b59b6"
            subtitle={`Ce mois: ${stats.chiffreAffairesMois.toFixed(2)} €`}
          />
        </GridItem>
      </Grid>
    </div>
  );
};

export default StatistiquesCommandes;
