// Stats Feature Constants

export const CHART_TYPES = {
  LINE: 'line' as const,
  AREA: 'area' as const,
  BAR: 'bar' as const,
  PIE: 'pie' as const,
};

export const METRIC_TYPES = {
  NUMBER: 'number' as const,
  CURRENCY: 'currency' as const,
  PERCENTAGE: 'percentage' as const,
};

export const TREND_TYPES = {
  POSITIVE: 'positive' as const,
  NEGATIVE: 'negative' as const,
  NEUTRAL: 'neutral' as const,
};

export const CHART_COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
];

export const DEFAULT_CHART_HEIGHT = 300;

export const MONTH_TRANSLATIONS: { [key: string]: string } = {
  'January': 'Janvier',
  'February': 'Février',
  'March': 'Mars',
  'April': 'Avril',
  'May': 'Mai',
  'June': 'Juin',
  'July': 'Juillet',
  'August': 'Août',
  'September': 'Septembre',
  'October': 'Octobre',
  'November': 'Novembre',
  'December': 'Décembre',
};

export const ATTENDANCE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  NEEDS_IMPROVEMENT: 0,
};

export const ATTENDANCE_COLORS = {
  EXCELLENT: '#28a745',
  GOOD: '#ffc107',
  NEEDS_IMPROVEMENT: '#dc3545',
};

export const DEFAULT_LIMITS = {
  RECENT_PAYMENTS: 10,
  NEW_MEMBERS: 10,
  TOP_MEMBERS: 10,
  OVERDUE_PAYMENTS: 10,
};

export const DASHBOARD_ROUTES = {
  MAIN: '/pages/dashboard',
  STATS: '/pages/statistiques',
  ADD_MEMBER: '/pages/utilisateurs/ajouter-utilisateur',
  PAYMENTS: '/pages/paiements',
  ADD_PLAN: '/pages/plans/ajouter',
};

export const AUTO_REDIRECT_DELAY = 5; // seconds
export const AUTH_CHECK_INTERVAL = 60000; // 1 minute in milliseconds

export const EMPTY_MESSAGES = {
  NO_DATA: 'Aucune donnée disponible',
  NO_PAYMENTS: 'Aucun paiement récent',
  NO_OVERDUE: 'Aucun paiement échu',
  NO_NEW_MEMBERS: 'Aucun nouveau membre',
  NO_CHART_DATA: 'Aucune donnée disponible pour le graphique',
};
