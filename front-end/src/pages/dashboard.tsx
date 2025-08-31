import React, { useEffect, useState } from 'react';
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
  FlexItem,
  ExpandableSection,
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
import { apiUrl } from './apiUrl';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const DashboardPage: React.FC = () => {
  // États pour les données dynamiques
  const [membresCount, setMembresCount] = useState<number>(0);
  const [paiementsMois, setPaiementsMois] = useState<number>(0);
  const [paiementsRecents, setPaiementsRecents] = useState<number>(0);
  const [paiementsEnAttente, setPaiementsEnAttente] = useState<number>(0);
  const [plansActifs, setPlansActifs] = useState<number>(0);
  const [tauxRenouvellement, setTauxRenouvellement] = useState<number>(0);
  const [paiementsParMois, setPaiementsParMois] = useState<any[]>([]);
  const [membresParPlan, setMembresParPlan] = useState<any[]>([]);
  const [lastPaiements, setLastPaiements] = useState<any[]>([]);
  const [isPaiementsExpanded, setIsPaiementsExpanded] = useState(false);

  const [echusPaiements, setEchusPaiements] = useState<any[]>([]);
  const [isEchusExpanded, setIsEchusExpanded] = useState(false);

  const [nouveauxMembres, setNouveauxMembres] = useState<any[]>([]);
  const [isNouveauxExpanded, setIsNouveauxExpanded] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch(apiUrl('statistiques/membres/count'))
      .then(res => res.json())
      .then(data => {
        console.log('membresCount', data);
        setMembresCount(data.count);
      })
      .catch(err => console.error('Erreur membresCount', err));

    fetch(apiUrl('statistiques/paiements/mois'))
      .then(res => res.json())
      .then(data => {
        console.log('paiementsMois', data);
        setPaiementsMois(data.total);
      })
      .catch(err => console.error('Erreur paiementsMois', err));

    fetch(apiUrl('statistiques/paiements/recents'))
      .then(res => res.json())
      .then(data => {
        console.log('paiementsRecents', data);
        setPaiementsRecents(data.count);
      })
      .catch(err => console.error('Erreur paiementsRecents', err));

    fetch(apiUrl('statistiques/paiements/en-attente'))
      .then(res => res.json())
      .then(data => {
        console.log('paiementsEnAttente', data);
        setPaiementsEnAttente(data.count);
      })
      .catch(err => console.error('Erreur paiementsEnAttente', err));

    fetch(apiUrl('statistiques/plans/actifs'))
      .then(res => res.json())
      .then(data => {
        console.log('plansActifs', data);
        setPlansActifs(data.count);
      })
      .catch(err => console.error('Erreur plansActifs', err));

    fetch(apiUrl('statistiques/plans/taux-renouvellement'))
      .then(res => res.json())
      .then(data => {
        console.log('tauxRenouvellement', data);
        setTauxRenouvellement(data.taux);
      })
      .catch(err => console.error('Erreur tauxRenouvellement', err));

    fetch(apiUrl('statistiques/paiements/par-mois'))
      .then(res => res.json())
      .then(data => {
        console.log('paiementsParMois', data);
        setPaiementsParMois(data);
      })
      .catch(err => console.error('Erreur paiementsParMois', err));

    fetch(apiUrl('statistiques/membres/par-plan'))
      .then(res => res.json())
      .then(data => {
        console.log('membresParPlan', data);
        setMembresParPlan(data);
      })
      .catch(err => console.error('Erreur membresParPlan', err));

    fetch(apiUrl('statistiques/paiements/derniers'))
      .then(res => res.json())
      .then(data => {
        console.log('lastPaiements', data);
        setLastPaiements(data);
      })
      .catch(err => console.error('Erreur lastPaiements', err));

    fetch(apiUrl('statistiques/paiements/echus'))
      .then(res => res.json())
      .then(data => {
        console.log('echusPaiements', data);
        setEchusPaiements(data);
      })
      .catch(err => console.error('Erreur echusPaiements', err));

    fetch(apiUrl('statistiques/membres/nouveaux'))
      .then(res => res.json())
      .then(data => {
        console.log('nouveauxMembres', data);
        setNouveauxMembres(data);
      })
      .catch(err => console.error('Erreur nouveauxMembres', err));
  }, []);

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
            <Button
              icon={<PlusIcon />}
              variant="primary"
              onClick={() => navigate('/pages/utilisateurs/ajouter-utilisateur')}
            >
              Ajouter un membre
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              icon={<CreditCardIcon />}
              variant="secondary"
              onClick={() => navigate('/pages/paiements')}
            >
              Enregistrer un paiement
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              icon={<EditIcon />}
              variant="tertiary"
              onClick={() => navigate('/pages/plans/ajouter')}
            >
              Créer un nouveau plan
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* KPIs */}
      <PageSection>
        <Gallery hasGutter>
          <Card isCompact>
            <CardTitle>Membres inscrits</CardTitle>
            <CardBody>{membresCount}</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Total encaissé ce mois-ci</CardTitle>
            <CardBody>{paiementsMois} €</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Paiements récents (7j)</CardTitle>
            <CardBody>{paiementsRecents} paiements</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Paiements en attente</CardTitle>
            <CardBody>{paiementsEnAttente} membres</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Plans d’abonnement actifs</CardTitle>
            <CardBody>{plansActifs} plans</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Taux de renouvellement</CardTitle>
            <CardBody>{tauxRenouvellement} %</CardBody>
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
                      {membresParPlan.map((_entry, index) => (
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

      {/* Tables ou listes récentes */}
      <PageSection>
        <Title headingLevel="h2">Derniers paiements</Title>
        <ExpandableSection
          toggleText={isPaiementsExpanded ? "Réduire" : "Voir les 10 derniers paiements"}
          isExpanded={isPaiementsExpanded}
          onToggle={() => setIsPaiementsExpanded(prev => !prev)}
        >
          {lastPaiements.length === 0 ? (
            <p>Aucun paiement récent.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Utilisateur</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Montant (€)</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Date</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {lastPaiements.map((p, idx) => {
                    const capitalize = (str: string) =>
                      str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return '';
                      const d = new Date(dateStr);
                      return d.toLocaleDateString();
                    };
                    const userDisplay = p.first_name && p.last_name
                      ? `${capitalize(p.first_name)} ${capitalize(p.last_name)}`
                      : p.nom_utilisateur?.replace(/_/g, ' ') || p.utilisateur_id;
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                          <strong>{userDisplay}</strong>
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.montant}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(p.date_paiement)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.statut}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ExpandableSection>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Paiements échus</Title>
        <ExpandableSection
          toggleText={isEchusExpanded ? "Réduire" : "Voir les paiements échus"}
          isExpanded={isEchusExpanded}
          onToggle={() => setIsEchusExpanded(prev => !prev)}
        >
          {echusPaiements.length === 0 ? (
            <p>Aucun paiement échu.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Utilisateur</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Montant (€)</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Période fin</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {echusPaiements.map((p, idx) => {
                    const capitalize = (str: string) =>
                      str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return '';
                      const d = new Date(dateStr);
                      return d.toLocaleDateString();
                    };
                    const userDisplay = p.first_name && p.last_name
                      ? `${capitalize(p.first_name)} ${capitalize(p.last_name)}`
                      : p.nom_utilisateur?.replace(/_/g, ' ') || p.utilisateur_id;
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                          <strong>{userDisplay}</strong>
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.montant}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(p.periode_fin)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.statut}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ExpandableSection>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Nouveaux membres inscrits</Title>
        <ExpandableSection
          toggleText={isNouveauxExpanded ? "Réduire" : "Voir les nouveaux membres"}
          isExpanded={isNouveauxExpanded}
          onToggle={() => setIsNouveauxExpanded(prev => !prev)}
        >
          {Array.isArray(nouveauxMembres) && nouveauxMembres.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nom</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Prénom</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Date d'inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {nouveauxMembres.map((m, idx) => {
                    const capitalize = (str: string) =>
                      str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return '';
                      const d = new Date(dateStr);
                      return d.toLocaleDateString();
                    };
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                          <strong>{capitalize(m.last_name)}</strong>
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                          <strong>{capitalize(m.first_name)}</strong>
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                          {formatDate(m.date_inscription)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Aucun nouveau membre.</p>
          )}
        </ExpandableSection>
      </PageSection>
    </>
  );
};

export default DashboardPage;

      