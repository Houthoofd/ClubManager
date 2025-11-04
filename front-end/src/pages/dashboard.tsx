import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Button,
  Flex,
  FlexItem,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { PlusIcon, CreditCardIcon, EditIcon } from '@patternfly/react-icons';
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
import { MetricCard } from '../components/dashboard/MetricCard';
import { ChartCard } from '../components/dashboard/ChartCard';
import { DataTable } from '../components/dashboard/DataTable';
import { ActionButton } from '../components/common/ActionButton';
import { ExpandableDataSection } from '../components/dashboard/ExpandableDataSection';
import { PageHeader } from '../components/common/PageHeader';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import AuthRequiredModal from '../components/common/modal/AuthRequiredModal';
import AuthGuard from '../components/auth/AuthGuard';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false);
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(false);
  const [isNewMembersExpanded, setIsNewMembersExpanded] = useState(false);

  // NOUVEAU: Hook pour gérer l'authentification et la redirection
  const { 
    showAuthModal, 
    redirectToLogin, 
    customMessage, 
    autoRedirectDelay 
  } = useAuthRedirect({
    autoRedirectDelay: 5,
    checkInterval: 60000, // Vérifier chaque minute sur le dashboard
    customMessage: "Votre session a expiré. Vous devez vous reconnecter pour accéder au tableau de bord."
  });

  console.log('DashboardPage mounted');

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

  const metrics = [
    {
      title: 'Membres inscrits',
      value: membresCount,
      type: 'number' as const,
      trend: '+5.2%',
      trendType: 'positive' as const,
    },
    {
      title: 'Total encaissé ce mois',
      value: paiementsMois,
      type: 'currency' as const,
      trend: '+12.3%',
      trendType: 'positive' as const,
    },
    {
      title: 'Paiements récents (7j)',
      value: paiementsRecents,
      type: 'number' as const,
      suffix: 'paiements',
    },
    {
      title: 'Paiements en attente',
      value: paiementsEnAttente,
      type: 'number' as const,
      suffix: 'membres',
      trend: '-3.1%',
      trendType: 'negative' as const,
    },
    {
      title: 'Plans actifs',
      value: plansActifs,
      type: 'number' as const,
      suffix: 'plans',
    },
    {
      title: 'Taux de renouvellement',
      value: tauxRenouvellement,
      type: 'percentage' as const,
      trend: '+2.4%',
      trendType: 'positive' as const,
    },
  ];

  const paymentsColumns = [
    { key: 'user', label: 'Utilisateur' },
    { key: 'amount', label: 'Montant' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Statut' },
  ];

  const overdueColumns = [
    { key: 'user', label: 'Utilisateur' },
    { key: 'amount', label: 'Montant' },
    { key: 'dueDate', label: 'Date d\'échéance' },
    { key: 'status', label: 'Statut' },
  ];

  const newMembersColumns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'registrationDate', label: 'Date d\'inscription' },
    { key: 'plan', label: 'Plan' },
  ];

  const formatPaymentsData = (payments: any[]) => {
    return payments.map(p => ({
      user: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : 'N/A',
      amount: p.montant ? `${p.montant} €` : 'N/A',
      date: p.date_paiement || 'N/A',
      status: p.statut || 'N/A',
    }));
  };

  const formatOverdueData = (overdue: any[]) => {
    return overdue.map(p => ({
      user: p.first_name && p.last_name 
        ? `${p.first_name.charAt(0).toUpperCase()}${p.first_name.slice(1)} ${p.last_name.charAt(0).toUpperCase()}${p.last_name.slice(1)}`
        : p.nom_utilisateur?.replace(/_/g, ' ') || p.utilisateur_id,
      amount: `${p.montant} €`,
      dueDate: p.periode_fin ? new Date(p.periode_fin).toLocaleDateString() : 'N/A',
      status: p.statut,
    }));
  };

  const formatNewMembersData = (members: any[]) => {
    return members.map(m => ({
      name: `${m.first_name} ${m.last_name}`,
      email: m.email || 'N/A',
      registrationDate: m.date_inscription ? new Date(m.date_inscription).toLocaleDateString() : 'N/A',
      plan: m.plan_name || 'N/A',
    }));
  };

  return (
    <div className="dashboard-page">
      {/* NOUVEAU: Modal d'authentification requise */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onRedirect={redirectToLogin}
        autoRedirectDelay={autoRedirectDelay}
        message={customMessage}
      />

      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de votre centre de fitness"
        variant="dashboard"
      />

      {/* Actions rapides */}
      <PageSection className="dashboard-actions">
        <Flex gap={{ default: 'gapMd' }} wrap={{ default: 'wrap' }}>
          <FlexItem>
            <ActionButton
              icon={<PlusIcon />}
              variant="primary"
              onClick={() => navigate('/pages/utilisateurs/ajouter-utilisateur')}
            >
              Ajouter un membre
            </ActionButton>
          </FlexItem>
          <FlexItem>
            <ActionButton
              icon={<CreditCardIcon />}
              variant="secondary"
              onClick={() => navigate('/pages/paiements')}
            >
              Enregistrer un paiement
            </ActionButton>
          </FlexItem>
          <FlexItem>
            <ActionButton
              icon={<EditIcon />}
              variant="tertiary"
              onClick={() => navigate('/pages/plans/ajouter')}
            >
              Créer un plan
            </ActionButton>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Métriques */}
      <PageSection className="dashboard-metrics">
        <Grid hasGutter span={4}>
          {metrics.map((metric, index) => (
            <GridItem key={index}>
              <MetricCard {...metric} />
            </GridItem>
          ))}
        </Grid>
      </PageSection>

      {/* Graphiques */}
      <PageSection className="dashboard-charts">
        <Grid hasGutter>
          <GridItem span={6}>
            <ChartCard
              title="Évolution des paiements"
              data={paiementsParMois}
              type="line"
              dataKey="total"
              xAxisKey="mois"
              color="#2563eb"
            />
          </GridItem>
          <GridItem span={6}>
            <ChartCard
              title="Répartition par plan"
              data={membresParPlan}
              type="pie"
              dataKey="value"
              nameKey="plan"
            />
          </GridItem>
        </Grid>
      </PageSection>

      {/* Sections expandables */}
      <PageSection className="dashboard-expandable-sections">
        <ExpandableDataSection
          title="Derniers paiements"
          count={derniersPaiements.length}
          isExpanded={isPaymentsExpanded}
          onToggle={() => setIsPaymentsExpanded(!isPaymentsExpanded)}
          variant="default"
        >
          <DataTable
            title=""
            data={formatPaymentsData(derniersPaiements)}
            columns={paymentsColumns}
            emptyMessage="Aucun paiement récent"
            hideTitle
          />
        </ExpandableDataSection>

        <ExpandableDataSection
          title="Paiements échus"
          count={paiementsEchus.length}
          isExpanded={isOverdueExpanded}
          onToggle={() => setIsOverdueExpanded(!isOverdueExpanded)}
          variant="warning"
        >
          <DataTable
            title=""
            data={formatOverdueData(paiementsEchus)}
            columns={overdueColumns}
            emptyMessage="Aucun paiement échu"
            variant="warning"
            hideTitle
          />
        </ExpandableDataSection>

        <ExpandableDataSection
          title="Nouveaux membres"
          count={nouveauxMembres.length}
          isExpanded={isNewMembersExpanded}
          onToggle={() => setIsNewMembersExpanded(!isNewMembersExpanded)}
          variant="success"
        >
          <DataTable
            title=""
            data={formatNewMembersData(nouveauxMembres)}
            columns={newMembersColumns}
            emptyMessage="Aucun nouveau membre"
            variant="success"
            hideTitle
          />
        </ExpandableDataSection>
      </PageSection>
    </div>
  );
};

export default DashboardPage;

