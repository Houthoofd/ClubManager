import React, { useState } from 'react';
import {
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  TabTitleIcon,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import UsersIcon from '@patternfly/react-icons/dist/esm/icons/users-icon';
import GraduationCapIcon from '@patternfly/react-icons/dist/esm/icons/graduation-cap-icon';
import VenusMarsIcon from '@patternfly/react-icons/dist/esm/icons/venus-mars-icon';
import BirthdayCakeIcon from '@patternfly/react-icons/dist/esm/icons/birthday-cake-icon';
import ShoppingCartIcon from '@patternfly/react-icons/dist/esm/icons/shopping-cart-icon';
import CalendarAltIcon from '@patternfly/react-icons/dist/esm/icons/calendar-alt-icon';
import { PageHeader } from '../components/common/PageHeader';
import {
  useTopAssidus,
  useMembresParGrade,
  useMembresParGenre,
  useAnniversaires,
  useArticlesVendus,
  useCoursSemaine,
} from '../hooks/useStatistiques';
import OngletStatistiques from '../components/statistiques/OngletStatistiques';
import CarteStatistique from '../components/statistiques/CarteStatistique';

const COLORS_GRADES = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const COLORS_GENRES = ['#0088FE', '#FFBB28', '#FF8042', '#00C49F'];

const StatistiquesPage: React.FC = () => {
  const { data: topAssidus = [] } = useTopAssidus();
  const { data: membresParGrade = [] } = useMembresParGrade();
  const { data: membresParGenre = [] } = useMembresParGenre();
  const { data: anniversaires = [] } = useAnniversaires();
  const { data: articlesVendus = [] } = useArticlesVendus();
  const { data: coursSemaine = { count: 0 } } = useCoursSemaine();

  const [views, setViews] = useState({
    assidus: true,
    grades: true,
    genres: true,
    articles: true
  });

  const [activeTabKey, setActiveTabKey] = useState<number>(0);

  const handleTabClick = (_event: unknown, tabIndex: string | number) => {
    setActiveTabKey(Number(tabIndex));
  };

  const toggleView = (key: keyof typeof views) => {
    setViews(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Configuration des graphiques et tableaux
  const chartConfigs = {
    assidus: {
      series: [{ dataKey: 'total_presences_validees', name: 'Présences validées', color: '#8884d8' }],
      xAxisKey: 'last_name'
    },
    grades: {
      serie: { dataKey: 'count', nameKey: 'grade_id', colors: COLORS_GRADES }
    },
    genres: {
      serie: { dataKey: 'count', nameKey: 'genre_name', colors: COLORS_GENRES }
    },
    articles: {
      series: [{ dataKey: 'total_vendu', name: 'Quantité vendue', color: '#82ca9d' }],
      xAxisKey: 'nom'
    }
  };

  const tableConfigs = {
    assidus: {
      colonnes: [
        { key: 'last_name', label: 'Nom' },
        { key: 'first_name', label: 'Prénom' },
        { key: 'total_presences_validees', label: 'Présences validées' }
      ]
    },
    grades: {
      colonnes: [
        { key: 'grade_id', label: 'Grade' },
        { key: 'count', label: 'Nombre' }
      ]
    },
    genres: {
      colonnes: [
        { key: 'genre_name', label: 'Genre' },
        { key: 'count', label: 'Nombre' }
      ]
    },
    articles: {
      colonnes: [
        { key: 'nom', label: 'Article' },
        { key: 'total_vendu', label: 'Quantité vendue' }
      ]
    },
    anniversaires: {
      colonnes: [
        { key: 'last_name', label: 'Nom' },
        { key: 'first_name', label: 'Prénom' },
        { 
          key: 'date_of_birth', 
          label: 'Date anniversaire',
          format: (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString() : ''
        }
      ]
    }
  };

  return (
    <div className="stats-page">
      <PageHeader
        title="Statistiques du club"
        subtitle="Vue d'ensemble des statistiques et analytics du club"
        variant="stats"
      />

      <PageSection className="stats-content">
        {/* Cartes de résumé */}
        <Grid hasGutter style={{ marginBottom: '2rem' }}>
          <GridItem xl={3} lg={4} md={6} sm={12}>
            <CarteStatistique
              title="Membres assidus"
              value={topAssidus.length}
              subtitle="Top performers"
              icon={<UsersIcon />}
              color="#8884d8"
            />
          </GridItem>
          <GridItem xl={3} lg={4} md={6} sm={12}>
            <CarteStatistique
              title="Grades actifs"
              value={membresParGrade.length}
              subtitle="Différents niveaux"
              icon={<GraduationCapIcon />}
              color="#82ca9d"
            />
          </GridItem>
          <GridItem xl={3} lg={4} md={6} sm={12}>
            <CarteStatistique
              title="Articles vendus"
              value={articlesVendus.reduce((sum, item) => sum + item.total_vendu, 0)}
              subtitle="Ventes totales"
              icon={<ShoppingCartIcon />}
              color="#ffc658"
            />
          </GridItem>
          <GridItem xl={3} lg={4} md={6} sm={12}>
            <CarteStatistique
              title="Cours cette semaine"
              value={typeof coursSemaine.count === 'number' ? coursSemaine.count : 0}
              subtitle="Sessions prévues"
              icon={<CalendarAltIcon />}
              color="#ff8042"
            />
          </GridItem>
        </Grid>

        <Tabs
          activeKey={activeTabKey}
          onSelect={handleTabClick}
          aria-label="Tabs statistiques"
          role="region"
        >
          <Tab eventKey={0} title={<><TabTitleIcon><UsersIcon /></TabTitleIcon><TabTitleText>Membres assidus</TabTitleText></>}>
            <OngletStatistiques
              title="Top 5 membres les plus assidus"
              data={topAssidus}
              showChart={views.assidus}
              onToggleView={() => toggleView('assidus')}
              type="bar"
              chartProps={chartConfigs.assidus}
              tableProps={tableConfigs.assidus}
              emptyMessage="Aucun membre assidu trouvé."
            />
          </Tab>

          <Tab eventKey={1} title={<><TabTitleIcon><GraduationCapIcon /></TabTitleIcon><TabTitleText>Par grade</TabTitleText></>}>
            <OngletStatistiques
              title="Répartition des membres par grade"
              data={membresParGrade}
              showChart={views.grades}
              onToggleView={() => toggleView('grades')}
              type="pie"
              chartProps={chartConfigs.grades}
              tableProps={tableConfigs.grades}
            />
          </Tab>

          <Tab eventKey={2} title={<><TabTitleIcon><VenusMarsIcon /></TabTitleIcon><TabTitleText>Par genre</TabTitleText></>}>
            <OngletStatistiques
              title="Répartition des membres par genre"
              data={membresParGenre}
              showChart={views.genres}
              onToggleView={() => toggleView('genres')}
              type="pie"
              chartProps={chartConfigs.genres}
              tableProps={tableConfigs.genres}
            />
          </Tab>

          <Tab eventKey={3} title={<><TabTitleIcon><BirthdayCakeIcon /></TabTitleIcon><TabTitleText>Anniversaires</TabTitleText></>}>
            <OngletStatistiques
              title="Prochains anniversaires des membres"
              data={anniversaires}
              showChart={false}
              onToggleView={() => {}}
              type="table"
              tableProps={tableConfigs.anniversaires}
              emptyMessage="Aucun anniversaire à venir."
            />
          </Tab>

          <Tab eventKey={4} title={<><TabTitleIcon><ShoppingCartIcon /></TabTitleIcon><TabTitleText>Articles vendus</TabTitleText></>}>
            <OngletStatistiques
              title="Articles les plus vendus"
              data={articlesVendus}
              showChart={views.articles}
              onToggleView={() => toggleView('articles')}
              type="bar"
              chartProps={chartConfigs.articles}
              tableProps={tableConfigs.articles}
              emptyMessage="Aucun article vendu."
            />
          </Tab>
        </Tabs>
      </PageSection>
    </div>
  );
};

export default StatistiquesPage;

