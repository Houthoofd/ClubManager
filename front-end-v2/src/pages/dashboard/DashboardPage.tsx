/**
 * Dashboard Page
 *
 * Main dashboard page showing overview and statistics for the logged-in user.
 *
 * @module pages/dashboard
 */

import React from 'react';
import {
  Page,
  PageSection,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  TextContent,
  Text,
} from '@patternfly/react-core';
import { useAuth } from '@features/auth';

/**
 * Dashboard Page Component
 */
export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Page>
        <PageSection>
          <TextContent>
            <Text>Chargement...</Text>
          </TextContent>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Tableau de bord
        </Title>
        <TextContent>
          <Text>
            Bienvenue, {user?.name || 'utilisateur'} !
          </Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          <GridItem span={12} md={6} lg={4}>
            <Card>
              <CardBody>
                <Title headingLevel="h2" size="lg">
                  Mes cours
                </Title>
                <TextContent>
                  <Text>Aucun cours pour le moment</Text>
                </TextContent>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={12} md={6} lg={4}>
            <Card>
              <CardBody>
                <Title headingLevel="h2" size="lg">
                  Prochaines sessions
                </Title>
                <TextContent>
                  <Text>Aucune session planifiée</Text>
                </TextContent>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={12} md={6} lg={4}>
            <Card>
              <CardBody>
                <Title headingLevel="h2" size="lg">
                  Statistiques
                </Title>
                <TextContent>
                  <Text>Données à venir</Text>
                </TextContent>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </Page>
  );
};

export default DashboardPage;
