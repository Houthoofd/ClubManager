import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Tabs,
  Tab,
  TabTitleText,
  TabTitleIcon,
  JumpLinks,
  JumpLinksItem,
} from '@patternfly/react-core';
import UsersIcon from '@patternfly/react-icons/dist/esm/icons/users-icon';
import GraduationCapIcon from '@patternfly/react-icons/dist/esm/icons/graduation-cap-icon';
import VenusMarsIcon from '@patternfly/react-icons/dist/esm/icons/venus-mars-icon';
import BirthdayCakeIcon from '@patternfly/react-icons/dist/esm/icons/birthday-cake-icon';
import ShoppingCartIcon from '@patternfly/react-icons/dist/esm/icons/shopping-cart-icon';
import CalendarAltIcon from '@patternfly/react-icons/dist/esm/icons/calendar-alt-icon';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  useTopAssidus,
  useMembresParGrade,
  useMembresParGenre,
  useAnniversaires,
  useArticlesVendus,
  useCoursSemaine,
} from '../hooks/useStatistiques';

const COLORS_GRADES = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const COLORS_GENRES = ['#0088FE', '#FFBB28', '#FF8042', '#00C49F'];

const StatistiquesPage: React.FC = () => {
  const { data: topAssidus = [] } = useTopAssidus();
  const { data: membresParGrade = [] } = useMembresParGrade();
  const { data: membresParGenre = [] } = useMembresParGenre();
  const { data: anniversaires = [] } = useAnniversaires();
  const { data: articlesVendus = [] } = useArticlesVendus();
  const { data: coursSemaine = 0 } = useCoursSemaine();

  const [showAssidusChart, setShowAssidusChart] = useState<boolean>(true);
  const [showGradeChart, setShowGradeChart] = useState<boolean>(true);
  const [showGenreChart, setShowGenreChart] = useState<boolean>(true);
  const [showAnnivTable, setShowAnnivTable] = useState<boolean>(true);
  const [showArticlesChart, setShowArticlesChart] = useState<boolean>(true);
  const [activeTabKey, setActiveTabKey] = useState<number>(0);

  const handleTabClick = (_event: unknown, tabIndex: string | number) => {
    setActiveTabKey(Number(tabIndex));
  };

  const renderSwitchLinks = (active: boolean, onSwitch: () => void, labelGraph: string, labelTable: string) => (
    <JumpLinks>
      <JumpLinksItem href="#" isActive={active} onClick={e => { e.preventDefault(); if (!active) onSwitch(); }}>
        {labelGraph}
      </JumpLinksItem>
      <JumpLinksItem href="#" isActive={!active} onClick={e => { e.preventDefault(); if (active) onSwitch(); }}>
        {labelTable}
      </JumpLinksItem>
    </JumpLinks>
  );

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Statistiques du club</Title>
        <p>Vue d’ensemble des statistiques avancées.</p>
      </PageSection>

      <PageSection>
        <Tabs
          activeKey={activeTabKey}
          onSelect={handleTabClick}
          aria-label="Tabs statistiques"
          role="region"
        >
          {/* Membres assidus */}
          <Tab eventKey={0} title={<><TabTitleIcon><UsersIcon /></TabTitleIcon><TabTitleText>Membres assidus</TabTitleText></>}>
            <Title headingLevel="h2">Top 5 membres les plus assidus</Title>
            <div style={{ margin: '2.5rem 0 2rem 0' }}>
              {renderSwitchLinks(showAssidusChart, () => setShowAssidusChart(prev => !prev), 'Graphique', 'Tableau')}
            </div>
            {topAssidus.length === 0 ? (
              <p>Aucun membre assidu trouvé.</p>
            ) : showAssidusChart ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topAssidus}>
                  <XAxis dataKey="last_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_presences_validees" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nom</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Prénom</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Présences validées</th>
                  </tr>
                </thead>
                <tbody>
                  {topAssidus.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{m.last_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{m.first_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{m.total_presences_validees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tab>

          {/* Répartition par grade */}
          <Tab eventKey={1} title={<><TabTitleIcon><GraduationCapIcon /></TabTitleIcon><TabTitleText>Par grade</TabTitleText></>}>
            <Title headingLevel="h2">Répartition des membres par grade</Title>
            <div style={{ margin: '2.5rem 0 2rem 0' }}>
              {renderSwitchLinks(showGradeChart, () => setShowGradeChart(prev => !prev), 'Graphique', 'Tableau')}
            </div>
            <div style={{ marginBottom: '1.5rem' }} />
            {membresParGrade.length === 0 ? (
              <p>Aucune donnée.</p>
            ) : showGradeChart ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={membresParGrade}
                    dataKey="count"
                    nameKey="grade_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {membresParGrade.map((_entry, idx) => (
                      <Cell key={`cell-grade-${idx}`} fill={COLORS_GRADES[idx % COLORS_GRADES.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Grade</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {membresParGrade.map((g, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{g.grade_id}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{g.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tab>

          {/* Répartition par genre */}
          <Tab eventKey={2} title={<><TabTitleIcon><VenusMarsIcon /></TabTitleIcon><TabTitleText>Par genre</TabTitleText></>}>
            <Title headingLevel="h2">Répartition des membres par genre</Title>
            <div style={{ margin: '2.5rem 0 2rem 0' }}>
              {renderSwitchLinks(showGenreChart, () => setShowGenreChart(prev => !prev), 'Graphique', 'Tableau')}
            </div>
            <div style={{ marginBottom: '1.5rem' }} />
            {membresParGenre.length === 0 ? (
              <p>Aucune donnée.</p>
            ) : showGenreChart ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={membresParGenre}
                    dataKey="count"
                    nameKey="genre_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {membresParGenre.map((_entry, idx) => (
                      <Cell key={`cell-genre-${idx}`} fill={COLORS_GENRES[idx % COLORS_GENRES.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Genre</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {membresParGenre.map((g, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{g.genre_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{g.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tab>

          {/* Anniversaires */}
          <Tab eventKey={3} title={<><TabTitleIcon><BirthdayCakeIcon /></TabTitleIcon><TabTitleText>Anniversaires</TabTitleText></>}>
            <Title headingLevel="h2">Prochains anniversaires des membres</Title>
            <div style={{ margin: '2.5rem 0 2rem 0' }}>
              {renderSwitchLinks(!showAnnivTable, () => setShowAnnivTable(prev => !prev), 'Graphique', 'Tableau')}
            </div>
            <div style={{ marginBottom: '1.5rem' }} />
            {anniversaires.length === 0 ? (
              <p>Aucun anniversaire à venir.</p>
            ) : showAnnivTable ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nom</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Prénom</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Date anniversaire</th>
                  </tr>
                </thead>
                <tbody>
                  {anniversaires.map((m, idx) => {
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return '';
                      const d = new Date(dateStr);
                      return d.toLocaleDateString();
                    };
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{m.last_name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{m.first_name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(m.date_of_birth)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={anniversaires}>
                  <XAxis dataKey="last_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="date_of_birth" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Tab>

          {/* Articles vendus */}
          <Tab eventKey={4} title={<><TabTitleIcon><ShoppingCartIcon /></TabTitleIcon><TabTitleText>Articles vendus</TabTitleText></>}>
            <Title headingLevel="h2">Articles les plus vendus</Title>
            <div style={{ margin: '2.5rem 0 2rem 0' }}>
              {renderSwitchLinks(showArticlesChart, () => setShowArticlesChart(prev => !prev), 'Graphique', 'Tableau')}
            </div>
            <div style={{ marginBottom: '1.5rem' }} />
            {articlesVendus.length === 0 ? (
              <p>Aucun article vendu.</p>
            ) : showArticlesChart ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={articlesVendus}>
                  <XAxis dataKey="nom" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_vendu" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Article</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Quantité vendue</th>
                  </tr>
                </thead>
                <tbody>
                  {articlesVendus.map((a, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{a.nom}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{a.total_vendu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tab>

          {/* Cours à venir */}
          <Tab eventKey={5} title={<><TabTitleIcon><CalendarAltIcon /></TabTitleIcon><TabTitleText>Cours à venir</TabTitleText></>}>
            <Title headingLevel="h2">Cours à venir cette semaine</Title>
            <Card isCompact>
              <CardBody>{coursSemaine} cours prévus</CardBody>
            </Card>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};

export default StatistiquesPage;

// Cette page est dédiée aux statistiques avancées du club.
