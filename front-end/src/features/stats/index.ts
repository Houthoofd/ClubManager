// Stats Feature - Main Barrel Export

// Pages
export { DashboardPage, StatistiquesPage } from './pages';

// Components
export {
  // Dashboard Components
  MetricCard,
  ChartCard,
  DataTable,
  ExpandableDataSection,
  // Statistiques Components
  StatistiquesTab,
  StatistiquesResume,
  StatistiquesGraphique,
  StatistiquesDetail,
  StatistiquesCompte,
} from './components';

// Hooks
export * from './hooks';

// Types
export type {
  ChartType,
  MetricType,
  TrendType,
  MetricCardData,
  ChartDataPoint,
  ChartSeries,
  StatistiquesFrequentationMois,
  StatistiquesFrequentation,
  DashboardMetric,
  PaymentData,
  MemberData,
  TableColumn,
  TableRowData,
  ExpandableSectionVariant,
} from './types';

// Constants
export {
  CHART_TYPES,
  METRIC_TYPES,
  TREND_TYPES,
  CHART_COLORS,
  DEFAULT_CHART_HEIGHT,
  MONTH_TRANSLATIONS,
  ATTENDANCE_THRESHOLDS,
  ATTENDANCE_COLORS,
  DEFAULT_LIMITS,
  DASHBOARD_ROUTES,
  AUTO_REDIRECT_DELAY,
  AUTH_CHECK_INTERVAL,
  EMPTY_MESSAGES,
} from './constants';
