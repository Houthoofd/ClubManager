import React, { useState } from 'react';
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
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  useMembresCount,
  usePaiementsMois,
  usePaiementsRecents,
  usePaiementsEnAttente,
  usePlansActifs,
  useTauxRenouvellement,
  usePaiementsParMois,
  useMembresParPlan,
  useDerniersPaiements,
  usePaiementsEchus,
  useNouveauxMembres,
} from '../hooks/useDashboard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

// Fonction utilitaire pour capitaliser une chaîne de caractères
const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Fonction utilitaire pour formater une date
const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString(); // Format par défaut basé sur la locale
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Utilisation des hooks React Query
  const { data: membresCount = 0 } = useMembresCount();
  const { data: paiementsMois = 0 } = usePaiementsMois();
  const { data: paiementsRecents = 0 } = usePaiementsRecents();
  const { data: paiementsEnAttente = 0 } = usePaiementsEnAttente();
  const { data: plansActifs = 0 } = usePlansActifs();
  const { data: tauxRenouvellement = 0 } = useTauxRenouvellement();
  const { data: paiementsParMois = [] } = usePaiementsParMois();
  const { data: membresParPlan = [] } = useMembresParPlan();
  const { data: derniersPaiements = [] } = useDerniersPaiements();
  const { data: paiementsEchus = [] } = usePaiementsEchus();
  const { data: nouveauxMembres = [] } = useNouveauxMembres();

  const [isPaiementsExpanded, setIsPaiementsExpanded] = useState(false);
  const [isEchusExpanded, setIsEchusExpanded] = useState(false);
  const [isNouveauxExpanded, setIsNouveauxExpanded] = useState(false);

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
            <CardBody>{typeof membresCount === 'number' ? membresCount : 'N/A'}</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Total encaissé ce mois-ci</CardTitle>
            <CardBody>{typeof paiementsMois === 'number' ? `${paiementsMois} €` : 'N/A'}</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Paiements récents (7j)</CardTitle>
            <CardBody>{typeof paiementsRecents === 'number' ? `${paiementsRecents} paiements` : 'N/A'}</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Paiements en attente</CardTitle>
            <CardBody>{typeof paiementsEnAttente === 'number' ? `${paiementsEnAttente} membres` : 'N/A'}</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Plans d’abonnement actifs</CardTitle>
            <CardBody>{typeof plansActifs === 'number' ? `${plansActifs} plans` : 'N/A'}</CardBody>
          </Card>
          <Card isCompact>
            <CardTitle>Taux de renouvellement</CardTitle>
            <CardBody>{typeof tauxRenouvellement === 'number' ? `${tauxRenouvellement} %` : 'N/A'}</CardBody>
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
                  <LineChart data={Array.isArray(paiementsParMois) ? paiementsParMois : []}>
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
                      data={Array.isArray(membresParPlan) ? membresParPlan : []}
                      dataKey="value"
                      nameKey="plan"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {Array.isArray(membresParPlan) &&
                        membresParPlan.map((_entry, index) => (
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
          {Array.isArray(derniersPaiements) && derniersPaiements.length > 0 ? (
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
                  {derniersPaiements.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <strong>{p.first_name || p.last_name ? `${p.first_name} ${p.last_name}` : 'N/A'}</strong>
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.montant || 'N/A'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.date_paiement || 'N/A'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.statut || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Aucun paiement récent.</p>
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
          {paiementsEchus.length === 0 ? (
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
                  {paiementsEchus.map((p, idx) => {
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
                  {nouveauxMembres.map((m, idx) => (
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
                  ))}
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

