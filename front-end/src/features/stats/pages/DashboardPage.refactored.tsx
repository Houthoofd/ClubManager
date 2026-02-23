/**
 * DashboardPage - Refactored
 *
 * Modern dashboard page using atomic components and business hooks
 * Features: stats overview, charts, real-time data, GraphQL integration
 *
 * Refactored architecture:
 * - Atomic components (StatsOverview, ChartCard, StatCard)
 * - Business hooks (useStatsData)
 * - GraphQL queries/mutations
 * - i18n support
 * - Responsive layout
 */

import React, { useState, useCallback } from 'react';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Title,
  Breadcrumb,
  BreadcrumbItem,
  Flex,
  FlexItem,
  Button,
  Tabs,
  Tab,
  TabTitleText,
  Grid,
  GridItem,
  Alert,
  Spinner,
  Select,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core';
import {
  SyncAltIcon,
  ExportIcon,
  ChartLineIcon,
  UsersIcon,
  ShoppingCartIcon,
  CubesIcon,
} from '@/shared/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Components
import {
  StatsOverview,
  ChartCard,
  StatCard,
  EmptyStatsState,
} from '../components';

// Hooks
import { useStatsData } from '../hooks/useStatsData';

// Store
import { useUIStore } from '@/core/store/uiStore';

/**
 * DashboardPage Component - Refactored
 */
export const DashboardPageRefactored: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();

  // State
  const [activeTab, setActiveTab] = useState<string | number>('overview');
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [isPeriodSelectOpen, setIsPeriodSelectOpen] = useState(false);

  // Load stats data
  const { data, metrics, overviewStats, isLoading, error, refetch } = useStatsData({
    period,
    enablePolling: false,
  });

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch();
    showNotification({
      type: 'info',
      title: t('common.messages.success'),
      message: t('stats.dashboard.loading'),
    });
  }, [refetch, showNotification, t]);

  const handlePeriodChange = useCallback(
    (_event: React.MouseEvent | React.ChangeEvent, value: string) => {
      setPeriod(value as 'week' | 'month' | 'year' | 'all');
      setIsPeriodSelectOpen(false);
    },
    []
  );

  const handleTabSelect = useCallback((_event: React.MouseEvent, tabIndex: string | number) => {
    setActiveTab(tabIndex);
  }, []);

  // Breadcrumb
  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbItem to="/">{t('navigation.menu.home')}</BreadcrumbItem>
      <BreadcrumbItem to="/stats" isActive>
        {t('stats.title')}
      </BreadcrumbItem>
    </Breadcrumb>
  );

  // Error state
  if (error && !isLoading) {
    return (
      <Page breadcrumb={breadcrumb}>
        <PageSection variant={PageSectionVariants.light}>
          <Alert variant="danger" title={t('stats.errors.loadTitle')}>
            {error.message}
          </Alert>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page breadcrumb={breadcrumb}>
      {/* Header */}
      <PageSection variant={PageSectionVariants.light}>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              {t('stats.dashboard.title')}
            </Title>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Select
                  variant={SelectVariant.single}
                  onToggle={(_event, isOpen) => setIsPeriodSelectOpen(isOpen)}
                  onSelect={handlePeriodChange}
                  selections={period}
                  isOpen={isPeriodSelectOpen}
                  placeholderText={t('stats.selectPeriod')}
                >
                  <SelectOption value="week">{t('stats.charts.weekly')}</SelectOption>
                  <SelectOption value="month">{t('stats.charts.monthly')}</SelectOption>
                  <SelectOption value="year">{t('stats.charts.yearly')}</SelectOption>
                  <SelectOption value="all">{t('common.labels.all', { defaultValue: 'Tout' })}</SelectOption>
                </Select>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="secondary"
                  icon={<SyncAltIcon />}
                  onClick={handleRefresh}
                  isLoading={isLoading}
                >
                  {t('common.actions.refresh')}
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="secondary" icon={<ExportIcon />} isDisabled>
                  {t('common.actions.export')}
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Tabs */}
      <PageSection variant={PageSectionVariants.light}>
        <Tabs activeKey={activeTab} onSelect={handleTabSelect}>
          <Tab
            eventKey="overview"
            title={<TabTitleText>{t('stats.tabs.overview')}</TabTitleText>}
          />
          <Tab
            eventKey="members"
            title={<TabTitleText>{t('stats.tabs.members')}</TabTitleText>}
          />
          <Tab
            eventKey="revenue"
            title={<TabTitleText>{t('stats.tabs.revenue')}</TabTitleText>}
          />
          <Tab
            eventKey="products"
            title={<TabTitleText>{t('stats.tabs.products')}</TabTitleText>}
          />
        </Tabs>
      </PageSection>

      {/* Content */}
      <PageSection variant={PageSectionVariants.default}>
        {isLoading && !data ? (
          <Flex justifyContent={{ default: 'justifyContentCenter' }}>
            <FlexItem>
              <Spinner size="xl" />
            </FlexItem>
          </Flex>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Overview Stats */}
                <StatsOverview
                  stats={overviewStats}
                  isLoading={isLoading}
                  columns={4}
                  responsiveColumns={{
                    default: 12,
                    sm: 6,
                    md: 6,
                    lg: 3,
                    xl: 3,
                  }}
                />

                <br />
                <br />

                {/* Charts */}
                {data && (
                  <Grid hasGutter>
                    <GridItem span={12} md={6}>
                      <ChartCard
                        title={t('stats.charts.revenueTrend')}
                        subtitle={t('stats.revenue.trend')}
                        data={data.revenue.byMonth.map((item) => ({
                          label: item.month,
                          value: item.amount,
                        }))}
                        chartType="line"
                        height={300}
                        isLoading={isLoading}
                      />
                    </GridItem>
                    <GridItem span={12} md={6}>
                      <ChartCard
                        title={t('stats.charts.orders')}
                        subtitle={t('stats.metrics.orders')}
                        data={[
                          { label: t('orders.status.pending'), value: data.orders.pending },
                          { label: t('orders.status.processing'), value: data.orders.processing },
                          { label: t('orders.status.completed'), value: data.orders.completed },
                        ]}
                        chartType="pie"
                        height={300}
                        isLoading={isLoading}
                      />
                    </GridItem>
                  </Grid>
                )}
              </>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && data && (
              <>
                <Grid hasGutter>
                  <GridItem span={12} md={4}>
                    <StatCard
                      title={t('stats.metrics.totalMembers')}
                      value={data.users.total}
                      icon={UsersIcon}
                      color="blue"
                      trend={metrics?.userGrowthTrend}
                    />
                  </GridItem>
                  <GridItem span={12} md={4}>
                    <StatCard
                      title={t('stats.metrics.activeUsers')}
                      value={data.users.active}
                      icon={UsersIcon}
                      color="green"
                    />
                  </GridItem>
                  <GridItem span={12} md={4}>
                    <StatCard
                      title={t('stats.metrics.newMembers')}
                      value={data.users.newThisMonth}
                      icon={UsersIcon}
                      color="cyan"
                      trend={metrics?.userGrowthTrend}
                    />
                  </GridItem>
                </Grid>

                <br />

                {/* Members charts placeholder */}
                <ChartCard
                  title={t('stats.members.title')}
                  subtitle={t('stats.members.byGrade')}
                  height={400}
                  emptyMessage={t('stats.members.noNewMembers')}
                />
              </>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && data && (
              <>
                <Grid hasGutter>
                  <GridItem span={12} md={4}>
                    <StatCard
                      title={t('stats.metrics.revenue')}
                      value={data.revenue.total}
                      icon={ChartLineIcon}
                      color="green"
                      isCurrency
                      currency="EUR"
                      trend={metrics?.revenueGrowthTrend}
                    />
                  </GridItem>
                  <GridItem span={12} md={4}>
                    <StatCard
                      title={t('stats.metrics.monthlyRevenue')}
                      value={data.revenue.thisMonth}
                      icon={ChartLineIcon}
                      color="blue"
                      isCurrency
                      currency="EUR"
                    />
                  </GridItem>
                  <GridItem span={12} md={4}>
                    <StatCard
                      title={t('stats.metrics.averageValue')}
                      value={metrics?.averageOrderValue || 0}
                      icon={ShoppingCartIcon}
                      color="purple"
                      isCurrency
                      currency="EUR"
                    />
                  </GridItem>
                </Grid>

                <br />

                <ChartCard
                  title={t('stats.revenue.trend')}
                  subtitle={t('stats.charts.monthly')}
                  data={data.revenue.byMonth.map((item) => ({
                    label: item.month,
                    value: item.amount,
                  }))}
                  chartType="area"
                  height={400}
                />
              </>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && data && (
              <>
                <Grid hasGutter>
                  <GridItem span={12} md={6}>
                    <StatCard
                      title={t('stats.products.totalSold')}
                      value={data.products.totalSold}
                      icon={CubesIcon}
                      color="orange"
                    />
                  </GridItem>
                  <GridItem span={12} md={6}>
                    <StatCard
                      title={t('stats.products.topProducts')}
                      value={data.products.topProducts.length}
                      icon={CubesIcon}
                      color="gold"
                      subtitle="Top 10"
                    />
                  </GridItem>
                </Grid>

                <br />

                {data.products.topProducts.length > 0 ? (
                  <ChartCard
                    title={t('stats.products.topProducts')}
                    data={data.products.topProducts.slice(0, 10).map((product) => ({
                      label: product.name,
                      value: product.quantitySold,
                    }))}
                    chartType="bar"
                    height={400}
                  />
                ) : (
                  <EmptyStatsState variant="noData" />
                )}
              </>
            )}
          </>
        )}
      </PageSection>
    </Page>
  );
};

export default DashboardPageRefactored;
