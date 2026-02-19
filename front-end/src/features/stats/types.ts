// Stats Feature Types

export type ChartType = 'line' | 'area' | 'bar' | 'pie';

export type MetricType = 'number' | 'currency' | 'percentage';

export type TrendType = 'positive' | 'negative' | 'neutral';

export interface MetricCardData {
  title: string;
  value: number;
  type: MetricType;
  suffix?: string;
  trend?: string;
  trendType?: TrendType;
}

export interface ChartDataPoint {
  [key: string]: any;
}

export interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
}

export interface StatistiquesFrequentationMois {
  mois: string;
  frequentation: number;
  pourcentage_de_cours_valides: number;
  nombres_total_de_cours_du_mois: number;
}

export interface StatistiquesFrequentation {
  mois: StatistiquesFrequentationMois[];
}

export interface DashboardMetric {
  title: string;
  value: number;
  type: MetricType;
  suffix?: string;
  trend?: string;
  trendType?: TrendType;
}

export interface PaymentData {
  user_first_name?: string;
  user_last_name?: string;
  user_id?: string;
  amount: number;
  payment_date?: string;
  status: string;
}

export interface MemberData {
  first_name?: string;
  last_name?: string;
  email?: string;
  created_at?: string;
  plan_name?: string;
}

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableRowData {
  [key: string]: string | number | JSX.Element;
}

export type ExpandableSectionVariant = 'default' | 'warning' | 'success' | 'info';
