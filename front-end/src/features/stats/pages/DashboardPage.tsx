import React, { useState } from "react";
import {
  PageSection,
  Flex,
  FlexItem,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import { PlusIcon, CreditCardIcon, EditIcon } from "@patternfly/react-icons";
import { useNavigate } from "react-router-dom";
import {
  useMembersCount,
  useMonthlyPayments,
  useRecentPayments,
  usePendingPayments,
  useActivePlans,
  useRenewalRate,
  usePaymentsByMonth,
  useMembersByPlan,
  useLastPayments,
  useOverduePayments,
  useNewMembers,
  useAuthRedirect,
} from "../hooks";
import {
  MetricCard,
  ChartCard,
  DataTable,
  ExpandableDataSection,
} from "../components";
import { ActionButton } from "@/shared/components/common-legacy/ActionButton";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import AuthRequiredModal from "@/shared/components/common-legacy/modal/AuthRequiredModal";
import { DASHBOARD_ROUTES, DEFAULT_LIMITS, AUTO_REDIRECT_DELAY, AUTH_CHECK_INTERVAL } from "../constants";
import type { DashboardMetric, PaymentData, MemberData, TableColumn } from "../types";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false);
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(false);
  const [isNewMembersExpanded, setIsNewMembersExpanded] = useState(false);

  // Authentication redirect
  const { showAuthModal, redirectToLogin, customMessage, autoRedirectDelay } =
    useAuthRedirect({
      autoRedirectDelay: AUTO_REDIRECT_DELAY,
      checkInterval: AUTH_CHECK_INTERVAL,
      customMessage:
        "Votre session a expiré. Vous devez vous reconnecter pour accéder au tableau de bord.",
    });

  console.log("🏠 DashboardPage mounted");

  // GraphQL hooks
  const {
    data: membersCountData,
    loading: loadingMembres,
    error: errorMembres,
  } = useMembersCount();
  const {
    data: monthlyPaymentsData,
    loading: loadingPaiementsMois,
    error: errorPaiementsMois,
  } = useMonthlyPayments();
  const {
    data: recentPaymentsData,
    loading: loadingPaiementsRecents,
    error: errorPaiementsRecents,
  } = useRecentPayments(7);
  const {
    data: pendingPaymentsData,
    loading: loadingPaiementsAttente,
    error: errorPaiementsAttente,
  } = usePendingPayments();
  const {
    data: activePlansData,
    loading: loadingPlans,
    error: errorPlans,
  } = useActivePlans();
  const {
    data: renewalRateData,
    loading: loadingTaux,
    error: errorTaux,
  } = useRenewalRate();
  const { data: paymentsByMonthData } = usePaymentsByMonth();
  const { data: membersByPlanData } = useMembersByPlan();
  const { data: lastPaymentsData } = useLastPayments(DEFAULT_LIMITS.RECENT_PAYMENTS);
  const { data: overduePaymentsData } = useOverduePayments();
  const { data: newMembersData } = useNewMembers(DEFAULT_LIMITS.NEW_MEMBERS);

  // Extract data from GraphQL responses
  const membresCount = membersCountData?.membersCount?.count ?? 0;
  const paiementsMois = monthlyPaymentsData?.monthlyPayments?.total ?? 0;
  const paiementsRecents = recentPaymentsData?.recentPayments?.length ?? 0;
  const paiementsEnAttente = pendingPaymentsData?.pendingPayments?.length ?? 0;
  const plansActifs = activePlansData?.activePlans?.length ?? 0;
  const tauxRenouvellement = renewalRateData?.renewalRate?.rate ?? 0;
  const paiementsParMois = paymentsByMonthData?.paymentsByMonth ?? [];
  const membresParPlan = membersByPlanData?.membersByPlan ?? [];
  const derniersPaiements = lastPaymentsData?.lastPayments ?? [];
  const paiementsEchus = overduePaymentsData?.overduePayments ?? [];
  const nouveauxMembres = newMembersData?.newMembers ?? [];

  // Debug logs
  console.log("📊 Dashboard Data Summary:");
  console.log(
    "- Membres Count:",
    membresCount,
    "Loading:",
    loadingMembres,
    "Error:",
    errorMembres,
  );
  console.log(
    "- Paiements Mois:",
    paiementsMois,
    "Loading:",
    loadingPaiementsMois,
    "Error:",
    errorPaiementsMois,
  );

  const metrics: DashboardMetric[] = [
    {
      title: "Membres inscrits",
      value: membresCount,
      type: "number",
      trend: "+5.2%",
      trendType: "positive",
    },
    {
      title: "Total encaissé ce mois",
      value: paiementsMois,
      type: "currency",
      trend: "+12.3%",
      trendType: "positive",
    },
    {
      title: "Paiements récents (7j)",
      value: paiementsRecents,
      type: "number",
      suffix: "paiements",
    },
    {
      title: "Paiements en attente",
      value: paiementsEnAttente,
      type: "number",
      suffix: "membres",
      trend: "-3.1%",
      trendType: "negative",
    },
    {
      title: "Plans actifs",
      value: plansActifs,
      type: "number",
      suffix: "plans",
    },
    {
      title: "Taux de renouvellement",
      value: tauxRenouvellement,
      type: "percentage",
      trend: "+2.4%",
      trendType: "positive",
    },
  ];

  console.log("📈 Final Metrics Configuration:", metrics);

  const paymentsColumns: TableColumn[] = [
    { key: "user", label: "Utilisateur" },
    { key: "amount", label: "Montant" },
    { key: "date", label: "Date" },
    { key: "status", label: "Statut" },
  ];

  const overdueColumns: TableColumn[] = [
    { key: "user", label: "Utilisateur" },
    { key: "amount", label: "Montant" },
    { key: "dueDate", label: "Date d'échéance" },
    { key: "status", label: "Statut" },
  ];

  const newMembersColumns: TableColumn[] = [
    { key: "name", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "registrationDate", label: "Date d'inscription" },
    { key: "plan", label: "Plan" },
  ];

  const formatPaymentsData = (payments: PaymentData[]) => {
    return payments.map((p) => ({
      user:
        p.user_first_name && p.user_last_name
          ? `${p.user_first_name} ${p.user_last_name}`
          : "N/A",
      amount: p.amount ? `${p.amount} €` : "N/A",
      date: p.payment_date
        ? new Date(p.payment_date).toLocaleDateString("fr-FR")
        : "N/A",
      status: p.status || "N/A",
    }));
  };

  const formatOverdueData = (overdue: PaymentData[]) => {
    return overdue.map((p) => ({
      user:
        p.user_first_name && p.user_last_name
          ? `${p.user_first_name.charAt(0).toUpperCase()}${p.user_first_name.slice(1)} ${p.user_last_name.charAt(0).toUpperCase()}${p.user_last_name.slice(1)}`
          : `User ${p.user_id}`,
      amount: `${p.amount} €`,
      dueDate: p.payment_date
        ? new Date(p.payment_date).toLocaleDateString("fr-FR")
        : "N/A",
      status:
        p.status === "completed"
          ? "✅ Payé"
          : p.status === "pending"
            ? "⏳ En attente"
            : "❌ Échu",
    }));
  };

  const formatNewMembersData = (members: MemberData[]) => {
    return members.map((m) => ({
      name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || "N/A",
      email: m.email || "N/A",
      registrationDate: m.created_at
        ? new Date(m.created_at).toLocaleDateString("fr-FR")
        : "N/A",
      plan: m.plan_name || "N/A",
    }));
  };

  return (
    <div className="dashboard-page">
      {/* Authentication modal */}
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

      {/* Quick actions */}
      <PageSection className="dashboard-actions">
        <Flex gap={{ default: "gapMd" }} wrap={{ default: "wrap" }}>
          <FlexItem>
            <ActionButton
              icon={<PlusIcon />}
              variant="primary"
              onClick={() => navigate(DASHBOARD_ROUTES.ADD_MEMBER)}
            >
              Ajouter un membre
            </ActionButton>
          </FlexItem>
          <FlexItem>
            <ActionButton
              icon={<CreditCardIcon />}
              variant="secondary"
              onClick={() => navigate(DASHBOARD_ROUTES.PAYMENTS)}
            >
              Enregistrer un paiement
            </ActionButton>
          </FlexItem>
          <FlexItem>
            <ActionButton
              icon={<EditIcon />}
              variant="tertiary"
              onClick={() => navigate(DASHBOARD_ROUTES.ADD_PLAN)}
            >
              Créer un plan
            </ActionButton>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Metrics */}
      <PageSection className="dashboard-metrics">
        <Grid hasGutter span={4}>
          {metrics.map((metric, index) => (
            <GridItem key={index}>
              <MetricCard {...metric} />
            </GridItem>
          ))}
        </Grid>
      </PageSection>

      {/* Charts */}
      <PageSection className="dashboard-charts">
        <Grid hasGutter>
          <GridItem span={6}>
            <ChartCard
              title="Évolution des paiements"
              data={paiementsParMois.map((p: any) => ({
                mois: p.month,
                total: p.total,
              }))}
              type="line"
              dataKey="total"
              xAxisKey="mois"
              color="#2563eb"
            />
          </GridItem>
          <GridItem span={6}>
            <ChartCard
              title="Répartition par plan"
              data={membresParPlan.map((p: any) => ({
                plan: p.plan_name,
                value: p.count,
              }))}
              type="pie"
              dataKey="value"
              nameKey="plan"
            />
          </GridItem>
        </Grid>
      </PageSection>

      {/* Expandable sections */}
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
