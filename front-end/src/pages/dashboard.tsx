import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Gallery,
  Grid,
  GridItem,
  Button,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import { PlusIcon, CreditCardIcon, EditIcon } from '@patternfly/react-icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Données fictives de graphique (tu peux les remplacer plus tard)
const paiementsParMois = [
  { mois: 'Jan', total: 800 },
  { mois: 'Fév', total: 1200 },
  { mois: 'Mar', total: 1000 },
  { mois: 'Avr', total: 1600 },
  { mois: 'Mai', total: 2100 }
];

const membresParPlan = [
  { plan: 'Basic', value: 30 },
  { plan: 'Premium', value: 50 },
  { plan: 'Gold', value: 20 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const DashboardPage: React.FC = () => {
  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Tableau de bord</Title>
        <p>Bienvenue dans votre espace d’administration.</p>
      </PageSection>

      {/* Actions rapides */}
      <PageSection>
        <Flex gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Button icon={<PlusIcon />} variant="primary">Ajouter un membre</Button>
          </FlexItem>
          <FlexItem>
            <Button icon={<CreditCardIcon />} variant="secondary">Enregistrer un paiement</Button>
          </FlexItem>
          <FlexItem>
            <Button icon={<EditIcon />} variant="tertiary">Créer un nouveau plan</Button>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* KPIs */}
      <PageSection>
        <Gallery hasGutter>
          <Card isCompact>
            <CardTitle>Membres inscrits</CardTitle>
            <CardBody>128</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Total encaissé ce mois-ci</CardTitle>
            <CardBody>2 150 €</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Paiements récents (7j)</CardTitle>
            <CardBody>17 paiements</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Paiements en attente</CardTitle>
            <CardBody>3 membres</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Plans d’abonnement actifs</CardTitle>
            <CardBody>4 plans</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Taux de renouvellement</CardTitle>
            <CardBody>78 %</CardBody>
          </Card>
        </Gallery>
      </PageSection>

      {/* Graphiques */}
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <Card>
              <CardTitle>Évolution des paiements (€/mois)</CardTitle>
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={paiementsParMois}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={6}>
            <Card>
              <CardTitle>Répartition des membres par plan</CardTitle>
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={membresParPlan}
                      dataKey="value"
                      nameKey="plan"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {membresParPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>

      {/* Tables ou listes récentes (à brancher avec ton composant Table plus tard) */}
      <PageSection>
        <Title headingLevel="h2">Derniers paiements</Title>
        <p>(À intégrer avec ton composant Table)</p>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Paiements échus</Title>
        <p>(Afficher les membres à relancer)</p>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Nouveaux membres inscrits</Title>
        <p>(Derniers inscrits sur les 7 derniers jours)</p>
      </PageSection>
    </>
  );
};

export default DashboardPage;
