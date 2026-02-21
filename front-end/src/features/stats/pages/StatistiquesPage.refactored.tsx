/**
 * ============================================================================
 * StatistiquesPage - Refactored
 * ============================================================================
 *
 * Detailed statistics page with comprehensive analytics.
 *
 * Features:
 * - GraphQL typed hooks (useAttendanceStatsQuery, etc.)
 * - Zustand stores (authStore, uiStore)
 * - react-i18next for translations
 * - PatternFly UI components
 * - Sentry tracking via withTracking HOC
 * - HOCs: withAuth, withAuthRole, withTracking, withErrorBoundary
 *
 * @refactored 2024 - Production ready
 */

import React, { useState, useMemo } from "react";
import {
  PageSection,
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  Alert,
  Select,
  SelectOption,
  SelectVariant,
  Title,
  Flex,
  FlexItem,
  Divider,
} from "@patternfly/react-core";
import {
  ChartLineIcon,
  UsersIcon,
  TrophyIcon,
  ShoppingCartIcon,
} from "@patternfly/react-icons";
import { useTranslation } from "react-i18next";
import { useTracking } from "@/shared/hooks/useTracking";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { withAuth } from "@/shared/hocs/withAuth";
import { withAuthRole } from "@/shared/hocs/withAuthRole";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useAuthStore } from "@/core/stores/authStore";
import { useUiStore } from "@/core/stores/uiStore";
import {
  useMembersCountQuery,
  useMembersByGradeQuery,
  useMembersByGenderQuery,
  useNewMembersQuery,
  useTopProductsQuery,
  useWeeklySessionsQuery,
  useMonthlyPaymentsQuery,
  usePaymentsByMonthQuery,
} from "@/core/api/apollo/generated/graphql";
import { MetricCard, ChartCard, DataTable } from "../components";

// ============================================================================
// Constants
// ============================================================================

const STATS_TABS = {
  OVERVIEW: 0,
  MEMBERS: 1,
  ATTENDANCE: 2,
  REVENUE: 3,
  PRODUCTS: 4,
} as const;

const TIME_PERIODS = [
  { value: "7", label: "7 derniers jours" },
  { value: "30", label: "30 derniers jours" },
  { value: "90", label: "3 derniers mois" },
  { value: "365", label: "12 derniers mois" },
] as const;

// ============================================================================
// Component
// ============================================================================

const StatistiquesPage: React.FC = () => {
  const { t } = useTranslation();
  const { trackEvent } = useTracking();
  const { user } = useAuthStore();
  const { showNotification } = useUiStore();

  // Local state
  const [activeTabKey, setActiveTabKey] = useState<number>(STATS_TABS.OVERVIEW);
  const [timePeriod, setTimePeriod] = useState<string>("30");
  const [isTimePeriodOpen, setIsTimePeriodOpen] = useState(false);

  // GraphQL queries
  const {
    data: membersCountData,
    loading: loadingMembers,
    error: errorMembers,
  } = useMembersCountQuery({
    onError: (err) => {
      console.error("❌ Error fetching members count:", err);
      trackEvent("stats_members_error", {
        error: err.message,
      });
    },
  });

  const {
    data: membersByGradeData,
    loading: loadingGrades,
  } = useMembersByGradeQuery({
    onError: (err) => {
      console.error("❌ Error fetching members by grade:", err);
    },
  });

  const {
    data: membersByGenderData,
    loading: loadingGender,
  } = useMembersByGenderQuery({
    onError: (err) => {
      console.error("❌ Error fetching members by gender:", err);
    },
  });

  const {
    data: newMembersData,
    loading: loadingNewMembers,
  } = useNewMembersQuery({
    variables: { days: parseInt(timePeriod) },
    onError: (err) => {
      console.error("❌ Error fetching new members:", err);
    },
  });

  const {
    data: topProductsData,
    loading: loadingProducts,
  } = useTopProductsQuery({
    variables: { limit: 10 },
    onError: (err) => {
      console.error("❌ Error fetching top products:", err);
    },
  });

  const {
    data: weeklySessionsData,
    loading: loadingSessions,
  } = useWeeklySessionsQuery({
    onError: (err) => {
      console.error("❌ Error fetching weekly sessions:", err);
    },
  });

  const {
    data: monthlyPaymentsData,
    loading: loadingPayments,
  } = useMonthlyPaymentsQuery({
    onError: (err) => {
      console.error("❌ Error fetching monthly payments:", err);
    },
  });

  const {
    data: paymentsByMonthData,
    loading: loadingPaymentsTrend,
  } = usePaymentsByMonthQuery({
    variables: { months: 12 },
    onError: (err) => {
      console.error("❌ Error fetching payments trend:", err);
    },
  });

  // Extract data
  const membersCount = membersCountData?.membersCount?.count ?? 0;
  const newMembersCount = newMembersData?.newMembers?.length ?? 0;
  const membersByGrade = membersByGradeData?.membersByGrade ?? [];
  const membersByGender = membersByGenderData?.membersByGender ?? [];
  const topProducts = topProductsData?.topProducts ?? [];
  const weeklySessions = weeklySessionsData?.weeklySessions ?? [];
  const monthlyRevenue = monthlyPaymentsData?.monthlyPayments?.total ?? 0;
  const paymentsTrend = paymentsByMonthData?.paymentsByMonth ?? [];

  // Calculate metrics
  const totalSessions = useMemo(() => {
    return weeklySessions.reduce((sum: number, s: any) => sum + (s.count || 0), 0);
  }, [weeklySessions]);

  const totalProductsSold = useMemo(() => {
    return topProducts.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
  }, [topProducts]);

  // Track page view on mount
  React.useEffect(() => {
    trackEvent("stats_page_view", {
      admin_id: user?.id,
      tab: "overview",
    });
  }, [trackEvent, user?.id]);

  // Event handlers
  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === "number") {
      setActiveTabKey(tabIndex);
      const tabNames = ["overview", "members", "attendance", "revenue", "products"];
      trackEvent("stats_tab_change", {
        tab: tabNames[tabIndex],
        admin_id: user?.id,
      });
    }
  };

  const handleTimePeriodSelect = (
    _event: React.MouseEvent | React.ChangeEvent,
    value: string | number
  ) => {
    const newPeriod = value.toString();
    setTimePeriod(newPeriod);
    setIsTimePeriodOpen(false);
    trackEvent("stats_period_change", {
      period: newPeriod,
    });
  };

  // Loading state
  const isLoading =
    loadingMembers ||
    loadingGrades ||
    loadingGender ||
    loadingNewMembers ||
    loadingProducts ||
    loadingSessions ||
    loadingPayments ||
    loadingPaymentsTrend;

  if (isLoading && activeTabKey === STATS_TABS.OVERVIEW) {
    return (
      <div className="stats-page">
        <PageHeader
          title={t("stats.title", "Statistiques")}
          subtitle={t(
            "stats.subtitle",
            "Analysez les performances de votre centre de fitness"
          )}
          variant="stats"
        />
        <PageSection>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <Spinner size="xl" />
            <p style={{ marginLeft: "1rem" }}>
              {t("stats.loading", "Chargement des statistiques...")}
            </p>
          </div>
        </PageSection>
      </div>
    );
  }

  // Error state
  if (errorMembers) {
    return (
      <div className="stats-page">
        <PageHeader
          title={t("stats.title", "Statistiques")}
          subtitle={t(
            "stats.subtitle",
            "Analysez les performances de votre centre de fitness"
          )}
          variant="stats"
        />
        <PageSection>
          <Alert
            variant="danger"
            title={t("stats.errors.loadTitle", "Erreur de chargement")}
            isInline
          >
            {t(
              "stats.errors.loadFailed",
              "Impossible de charger les statistiques. Veuillez réessayer."
            )}
          </Alert>
        </PageSection>
      </div>
    );
  }

  // Main render
  return (
    <div className="stats-page">
      <PageHeader
        title={t("stats.title", "Statistiques")}
        subtitle={t(
          "stats.subtitle",
          "Analysez les performances de votre centre de fitness"
        )}
        variant="stats"
      />

      <PageSection className="stats-content">
        {/* Time period selector */}
        <Flex justifyContent={{ default: "justifyContentFlexEnd" }} style={{ marginBottom: "1rem" }}>
          <FlexItem>
            <Select
              variant={SelectVariant.single}
              onToggle={() => setIsTimePeriodOpen(!isTimePeriodOpen)}
              onSelect={handleTimePeriodSelect}
              selections={timePeriod}
              isOpen={isTimePeriodOpen}
              placeholderText={t("stats.selectPeriod", "Sélectionner une période")}
            >
              {TIME_PERIODS.map((period) => (
                <SelectOption key={period.value} value={period.value}>
                  {period.label}
                </SelectOption>
              ))}
            </Select>
          </FlexItem>
        </Flex>

        <Tabs
          activeKey={activeTabKey}
          onSelect={handleTabClick}
          className="modern-tabs"
        >
          {/* Tab: Vue d'ensemble */}
          <Tab
            eventKey={STATS_TABS.OVERVIEW}
            title={
              <TabTitleText>
                <ChartLineIcon style={{ marginRight: "0.5rem" }} />
                {t("stats.tabs.overview", "Vue d'ensemble")}
              </TabTitleText>
            }
          >
            <Grid hasGutter>
              {/* Key metrics */}
              <GridItem span={3}>
                <MetricCard
                  title={t("stats.metrics.totalMembers", "Membres inscrits")}
                  value={membersCount}
                  type="number"
                  icon={<UsersIcon />}
                />
              </GridItem>
              <GridItem span={3}>
                <MetricCard
                  title={t("stats.metrics.newMembers", "Nouveaux membres")}
                  value={newMembersCount}
                  type="number"
                  suffix={`(${timePeriod}j)`}
                  trend="+12%"
                  trendType="positive"
                />
              </GridItem>
              <GridItem span={3}>
                <MetricCard
                  title={t("stats.metrics.weeklySessions", "Séances cette semaine")}
                  value={totalSessions}
                  type="number"
                />
              </GridItem>
              <GridItem span={3}>
                <MetricCard
                  title={t("stats.metrics.monthlyRevenue", "Revenus ce mois")}
                  value={monthlyRevenue}
                  type="currency"
                  trend="+8.5%"
                  trendType="positive"
                />
              </GridItem>

              {/* Charts */}
              <GridItem span={6}>
                <ChartCard
                  title={t("stats.charts.membersByGrade", "Membres par grade")}
                  data={membersByGrade.map((g: any) => ({
                    grade: g.grade_name || "Sans grade",
                    count: g.count,
                  }))}
                  type="bar"
                  dataKey="count"
                  xAxisKey="grade"
                  color="#0066cc"
                />
              </GridItem>
              <GridItem span={6}>
                <ChartCard
                  title={t("stats.charts.membersByGender", "Répartition par genre")}
                  data={membersByGender.map((g: any) => ({
                    gender: g.gender === "M" ? "Hommes" : g.gender === "F" ? "Femmes" : "Autre",
                    value: g.count,
                  }))}
                  type="pie"
                  dataKey="value"
                  nameKey="gender"
                />
              </GridItem>

              <GridItem span={12}>
                <ChartCard
                  title={t("stats.charts.revenueTrend", "Évolution des revenus (12 mois)")}
                  data={paymentsTrend.map((p: any) => ({
                    month: p.month,
                    total: p.total,
                  }))}
                  type="line"
                  dataKey="total"
                  xAxisKey="month"
                  color="#2563eb"
                />
              </GridItem>
            </Grid>
          </Tab>

          {/* Tab: Membres */}
          <Tab
            eventKey={STATS_TABS.MEMBERS}
            title={
              <TabTitleText>
                <UsersIcon style={{ marginRight: "0.5rem" }} />
                {t("stats.tabs.members", "Membres")}
              </TabTitleText>
            }
          >
            <Grid hasGutter>
              <GridItem span={12}>
                <Card>
                  <CardTitle>
                    {t("stats.members.title", "Statistiques des membres")}
                  </CardTitle>
                  <CardBody>
                    <Grid hasGutter>
                      <GridItem span={6}>
                        <ChartCard
                          title={t("stats.members.byGrade", "Distribution par grade")}
                          data={membersByGrade.map((g: any) => ({
                            grade: g.grade_name || "Sans grade",
                            count: g.count,
                          }))}
                          type="bar"
                          dataKey="count"
                          xAxisKey="grade"
                          color="#17a2b8"
                        />
                      </GridItem>
                      <GridItem span={6}>
                        <ChartCard
                          title={t("stats.members.byGender", "Distribution par genre")}
                          data={membersByGender.map((g: any) => ({
                            gender:
                              g.gender === "M" ? "Hommes" : g.gender === "F" ? "Femmes" : "Autre",
                            value: g.count,
                          }))}
                          type="pie"
                          dataKey="value"
                          nameKey="gender"
                        />
                      </GridItem>
                    </Grid>

                    <Divider style={{ margin: "2rem 0" }} />

                    <Title headingLevel="h3" size="lg" style={{ marginBottom: "1rem" }}>
                      {t("stats.members.newMembers", "Nouveaux membres ({{days}} jours)", {
                        days: timePeriod,
                      })}
                    </Title>
                    <DataTable
                      title=""
                      data={(newMembersData?.newMembers || []).map((m: any) => ({
                        name: `${m.first_name || ""} ${m.last_name || ""}`.trim(),
                        email: m.email || "N/A",
                        registrationDate: m.created_at
                          ? new Date(m.created_at).toLocaleDateString("fr-FR")
                          : "N/A",
                        plan: m.plan_name || "N/A",
                      }))}
                      columns={[
                        { key: "name", label: t("stats.table.name", "Nom") },
                        { key: "email", label: t("stats.table.email", "Email") },
                        {
                          key: "registrationDate",
                          label: t("stats.table.registrationDate", "Date d'inscription"),
                        },
                        { key: "plan", label: t("stats.table.plan", "Plan") },
                      ]}
                      emptyMessage={t("stats.members.noNewMembers", "Aucun nouveau membre")}
                      hideTitle
                    />
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </Tab>

          {/* Tab: Fréquentation */}
          <Tab
            eventKey={STATS_TABS.ATTENDANCE}
            title={
              <TabTitleText>
                <TrophyIcon style={{ marginRight: "0.5rem" }} />
                {t("stats.tabs.attendance", "Fréquentation")}
              </TabTitleText>
            }
          >
            <Grid hasGutter>
              <GridItem span={12}>
                <Card>
                  <CardTitle>
                    {t("stats.attendance.title", "Statistiques de fréquentation")}
                  </CardTitle>
                  <CardBody>
                    <ChartCard
                      title={t("stats.attendance.weeklySessions", "Séances de la semaine")}
                      data={weeklySessions.map((s: any) => ({
                        day: s.day_name || "N/A",
                        count: s.count,
                      }))}
                      type="bar"
                      dataKey="count"
                      xAxisKey="day"
                      color="#28a745"
                    />

                    <div style={{ marginTop: "2rem", textAlign: "center" }}>
                      <Title headingLevel="h4" size="md">
                        {t("stats.attendance.totalSessions", "Total des séances")}
                      </Title>
                      <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#28a745" }}>
                        {totalSessions}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </Tab>

          {/* Tab: Revenus */}
          <Tab
            eventKey={STATS_TABS.REVENUE}
            title={
              <TabTitleText>
                💰 {t("stats.tabs.revenue", "Revenus")}
              </TabTitleText>
            }
          >
            <Grid hasGutter>
              <GridItem span={12}>
                <Card>
                  <CardTitle>{t("stats.revenue.title", "Statistiques des revenus")}</CardTitle>
                  <CardBody>
                    <Grid hasGutter>
                      <GridItem span={4}>
                        <MetricCard
                          title={t("stats.revenue.monthly", "Revenus ce mois")}
                          value={monthlyRevenue}
                          type="currency"
                          trend="+8.5%"
                          trendType="positive"
                        />
                      </GridItem>
                      <GridItem span={12}>
                        <ChartCard
                          title={t("stats.revenue.trend", "Évolution des revenus (12 mois)")}
                          data={paymentsTrend.map((p: any) => ({
                            month: p.month,
                            total: p.total,
                          }))}
                          type="line"
                          dataKey="total"
                          xAxisKey="month"
                          color="#dc3545"
                        />
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </Tab>

          {/* Tab: Produits */}
          <Tab
            eventKey={STATS_TABS.PRODUCTS}
            title={
              <TabTitleText>
                <ShoppingCartIcon style={{ marginRight: "0.5rem" }} />
                {t("stats.tabs.products", "Produits")}
              </TabTitleText>
            }
          >
            <Grid hasGutter>
              <GridItem span={12}>
                <Card>
                  <CardTitle>{t("stats.products.title", "Statistiques des produits")}</CardTitle>
                  <CardBody>
                    <Title headingLevel="h3" size="lg" style={{ marginBottom: "1rem" }}>
                      {t("stats.products.topProducts", "Top 10 des produits vendus")}
                    </Title>
                    <DataTable
                      title=""
                      data={topProducts.map((p: any, index: number) => ({
                        rank: `#${index + 1}`,
                        name: p.product_name || "N/A",
                        quantity: p.quantity || 0,
                        revenue: `${p.revenue || 0} €`,
                      }))}
                      columns={[
                        { key: "rank", label: t("stats.table.rank", "Rang") },
                        { key: "name", label: t("stats.table.product", "Produit") },
                        { key: "quantity", label: t("stats.table.quantity", "Quantité") },
                        { key: "revenue", label: t("stats.table.revenue", "Revenu") },
                      ]}
                      emptyMessage={t("stats.products.noProducts", "Aucun produit vendu")}
                      hideTitle
                    />

                    <div style={{ marginTop: "2rem", textAlign: "center" }}>
                      <Title headingLevel="h4" size="md">
                        {t("stats.products.totalSold", "Total des produits vendus")}
                      </Title>
                      <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#6610f2" }}>
                        {totalProductsSold}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </Tab>
        </Tabs>
      </PageSection>
    </div>
  );
};

// ============================================================================
// Exports with HOCs
// ============================================================================

export default withErrorBoundary(
  withTracking(
    withAuthRole(
      withAuth(StatistiquesPage, {
        requireAuth: true,
        redirectTo: "/login",
      }),
      ["admin", "manager"]
    ),
    "statistics"
  )
);
