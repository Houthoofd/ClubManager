import React, { useState } from "react";
import {
  PageSection,
  Title,
  Button,
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
} from "../hooks";
import { MetricCard } from "../components/dashboard/MetricCard";
import { ChartCard } from "../components/dashboard/ChartCard";
import { DataTable } from "../components/dashboard/DataTable";
import { ActionButton } from "../components/common/ActionButton";
import { ExpandableDataSection } from "../components/dashboard/ExpandableDataSection";
import { PageHeader } from "../components/common/PageHeader";
import { useAuthRedirect } from "../hooks/useAuthRedirect";
import AuthRequiredModal from "../components/common/modal/AuthRequiredModal";
import AuthGuard from "../components/auth/AuthGuard";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false);
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(false);
  const [isNewMembersExpanded, setIsNewMembersExpanded] = useState(false);

  // NOUVEAU: Hook pour gérer l'authentification et la redirection
  const { showAuthModal, redirectToLogin, customMessage, autoRedirectDelay } =
    useAuthRedirect({
      autoRedirectDelay: 5,
      checkInterval: 60000, // Vérifier chaque minute sur le dashboard
      customMessage:
        "Votre session a expiré. Vous devez vous reconnecter pour accéder au tableau de bord.",
    });

  console.log("🏠 DashboardPage mounted");

  // Utilisation des hooks GraphQL Apollo
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
  const { data: lastPaymentsData } = useLastPayments(10);
  const { data: overduePaymentsData } = useOverduePayments();
  const { data: newMembersData } = useNewMembers(10);

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

  // Debug logs pour les données finales
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
  console.log(
    "- Paiements Récents:",
    paiementsRecents,
    "Loading:",
    loadingPaiementsRecents,
    "Error:",
    errorPaiementsRecents,
  );
  console.log(
    "- Paiements Attente:",
    paiementsEnAttente,
    "Loading:",
    loadingPaiementsAttente,
    "Error:",
    errorPaiementsAttente,
  );
  console.log(
    "- Plans Actifs:",
    plansActifs,
    "Loading:",
    loadingPlans,
    "Error:",
    errorPlans,
  );
  console.log(
    "- Taux Renouvellement:",
    tauxRenouvellement,
    "Loading:",
    loadingTaux,
    "Error:",
    errorTaux,
  );
  console.log("- Paiements Par Mois:", paiementsParMois);
  console.log("- Membres Par Plan:", membresParPlan);
  console.log("- Derniers Paiements:", derniersPaiements);
  console.log("- Paiements Échus:", paiementsEchus);
  console.log("- Nouveaux Membres:", nouveauxMembres);

  const metrics = [
    {
      title: "Membres inscrits",
      value: membresCount,
      type: "number" as const,
      trend: "+5.2%",
      trendType: "positive" as const,
    },
    {
      title: "Total encaissé ce mois",
      value: paiementsMois,
      type: "currency" as const,
      trend: "+12.3%",
      trendType: "positive" as const,
    },
    {
      title: "Paiements récents (7j)",
      value: paiementsRecents,
      type: "number" as const,
      suffix: "paiements",
    },
    {
      title: "Paiements en attente",
      value: paiementsEnAttente,
      type: "number" as const,
      suffix: "membres",
      trend: "-3.1%",
      trendType: "negative" as const,
    },
    {
      title: "Plans actifs",
      value: plansActifs,
      type: "number" as const,
      suffix: "plans",
    },
    {
      title: "Taux de renouvellement",
      value: tauxRenouvellement,
      type: "percentage" as const,
      trend: "+2.4%",
      trendType: "positive" as const,
    },
  ];

  console.log("📈 Final Metrics Configuration:", metrics);

  const paymentsColumns = [
    { key: "user", label: "Utilisateur" },
    { key: "amount", label: "Montant" },
    { key: "date", label: "Date" },
    { key: "status", label: "Statut" },
  ];

  const overdueColumns = [
    { key: "user", label: "Utilisateur" },
    { key: "amount", label: "Montant" },
    { key: "dueDate", label: "Date d'échéance" },
    { key: "status", label: "Statut" },
  ];

  const newMembersColumns = [
    { key: "name", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "registrationDate", label: "Date d'inscription" },
    { key: "plan", label: "Plan" },
  ];

  const formatPaymentsData = (payments: any[]) => {
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

  const formatOverdueData = (overdue: any[]) => {
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

  const formatNewMembersData = (members: any[]) => {
    return members.map((m) => ({
      name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || "N/A",
      email: m.email || "N/A",
      registrationDate: m.created_at
        ? new Date(m.created_at).toLocaleDateString("fr-FR")
        : "N/A",
      plan: "N/A", // Plan info not included in newMembers query
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
        <Flex gap={{ default: "gapMd" }} wrap={{ default: "wrap" }}>
          <FlexItem>
            <ActionButton
              icon={<PlusIcon />}
              variant="primary"
              onClick={() =>
                navigate("/pages/utilisateurs/ajouter-utilisateur")
              }
            >
              Ajouter un membre
            </ActionButton>
          </FlexItem>
          <FlexItem>
            <ActionButton
              icon={<CreditCardIcon />}
              variant="secondary"
              onClick={() => navigate("/pages/paiements")}
            >
              Enregistrer un paiement
            </ActionButton>
          </FlexItem>
          <FlexItem>
            <ActionButton
              icon={<EditIcon />}
              variant="tertiary"
              onClick={() => navigate("/pages/plans/ajouter")}
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
              data={membresParPlan.map((p) => ({
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
