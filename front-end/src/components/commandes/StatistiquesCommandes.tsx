import React from 'react';
import { Card, Title, Grid, GridItem } from '@patternfly/react-core';

interface StatistiquesCommandesProps {
  commandes: any[];
}

const StatistiquesCommandes: React.FC<StatistiquesCommandesProps> = ({ commandes }) => {
  const statistiques = React.useMemo(() => {
    const total = commandes.length;
    const enAttente = commandes.filter(c => c.statut === 'En attente').length;
    const expediees = commandes.filter(c => c.statut === 'Expédiée').length;
    const enCours = commandes.filter(c => c.statut === 'En cours').length;
    const annulees = commandes.filter(c => c.statut === 'Annulée').length;
    
    const chiffreAffaires = commandes
      .filter(c => c.statut === 'Expédiée')
      .reduce((sum, c) => sum + c.articles.reduce((articleSum: number, a: any) => articleSum + a.prix * a.quantite, 0), 0);

    return { total, enAttente, expediees, enCours, annulees, chiffreAffaires };
  }, [commandes]);

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    color: string; 
    subtitle?: string;
  }> = ({ title, value, color, subtitle }) => (
    <Card style={{
      padding: '1.5rem',
      borderRadius: '12px',
      border: `2px solid ${color}`,
      background: `${color}08`,
      textAlign: 'center',
      transition: 'transform 0.2s ease-in-out'
    }}>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color,
        marginBottom: '0.5rem'
      }}>
        {value}
      </div>
      <Title headingLevel="h4" size="sm" style={{ color: '#495057', margin: 0 }}>
        {title}
      </Title>
      {subtitle && (
        <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
          {subtitle}
        </div>
      )}
    </Card>
  );

  return (
    <div style={{ marginBottom: '2rem' }}>
      <Title headingLevel="h3" style={{ marginBottom: '1rem', color: '#333' }}>
        Aperçu des commandes
      </Title>
      
      <Grid hasGutter>
        <GridItem xl={2} lg={3} md={4} sm={6} xs={12}>
          <StatCard
            title="Total commandes"
            value={statistiques.total}
            color="#007bff"
          />
        </GridItem>
        
        <GridItem xl={2} lg={3} md={4} sm={6} xs={12}>
          <StatCard
            title="En attente"
            value={statistiques.enAttente}
            color="#ffc107"
          />
        </GridItem>
        
        <GridItem xl={2} lg={3} md={4} sm={6} xs={12}>
          <StatCard
            title="En cours"
            value={statistiques.enCours}
            color="#17a2b8"
          />
        </GridItem>
        
        <GridItem xl={2} lg={3} md={4} sm={6} xs={12}>
          <StatCard
            title="Expédiées"
            value={statistiques.expediees}
            color="#28a745"
          />
        </GridItem>
        
        <GridItem xl={2} lg={3} md={4} sm={6} xs={12}>
          <StatCard
            title="Annulées"
            value={statistiques.annulees}
            color="#dc3545"
          />
        </GridItem>
        
        <GridItem xl={2} lg={3} md={4} sm={6} xs={12}>
          <StatCard
            title="Chiffre d'affaires"
            value={`${statistiques.chiffreAffaires.toFixed(0)} €`}
            color="#6f42c1"
            subtitle="Commandes expédiées"
          />
        </GridItem>
      </Grid>
    </div>
  );
};

export default StatistiquesCommandes;
