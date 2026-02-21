/**
 * ====================================================================
 * USER STATISTICS SERVICE - Business Logic Layer
 * ====================================================================
 *
 * Service contenant la logique métier pour les statistiques utilisateur.
 * Calculs de fréquentation, taux de présence, analyses temporelles.
 *
 * @module features/users/services
 */

// ============================================================================
// Types
// ============================================================================

export interface AttendanceRecord {
  mois: string; // Format: "YYYY-MM" ou "Janvier 2024"
  frequentation: number;
  pourcentage_de_cours_valides: number;
  nombre_cours_total?: number;
  nombre_cours_valides?: number;
}

export interface AttendanceStats {
  totalPresences: number;
  averageAttendanceRate: number;
  bestMonth: AttendanceRecord | null;
  worstMonth: AttendanceRecord | null;
  trend: 'increasing' | 'decreasing' | 'stable';
  currentStreak: number;
  longestStreak: number;
}

export interface MonthlyComparison {
  month: string;
  currentYear: number;
  previousYear: number;
  change: number;
  changePercentage: number;
}

// ============================================================================
// Attendance Calculations
// ============================================================================

/**
 * Calcule le total des présences
 *
 * @param records - Données de fréquentation
 * @returns Nombre total de présences
 */
export const calculateTotalAttendance = (records: AttendanceRecord[]): number => {
  return records.reduce((total, record) => total + record.frequentation, 0);
};

/**
 * Calcule le taux de présence moyen
 *
 * @param records - Données de fréquentation
 * @returns Taux moyen en pourcentage
 */
export const calculateAverageAttendanceRate = (records: AttendanceRecord[]): number => {
  if (records.length === 0) return 0;

  const total = records.reduce((sum, record) => sum + record.pourcentage_de_cours_valides, 0);
  return Math.round((total / records.length) * 10) / 10;
};

/**
 * Trouve le mois avec le meilleur taux de présence
 *
 * @param records - Données de fréquentation
 * @returns Meilleur mois ou null
 */
export const getBestAttendanceMonth = (records: AttendanceRecord[]): AttendanceRecord | null => {
  if (records.length === 0) return null;

  return records.reduce((best, current) =>
    current.pourcentage_de_cours_valides > best.pourcentage_de_cours_valides ? current : best
  );
};

/**
 * Trouve le mois avec le pire taux de présence
 *
 * @param records - Données de fréquentation
 * @returns Pire mois ou null
 */
export const getWorstAttendanceMonth = (records: AttendanceRecord[]): AttendanceRecord | null => {
  if (records.length === 0) return null;

  return records.reduce((worst, current) =>
    current.pourcentage_de_cours_valides < worst.pourcentage_de_cours_valides ? current : worst
  );
};

/**
 * Calcule la tendance de fréquentation (hausse/baisse/stable)
 *
 * @param records - Données de fréquentation (triées par date)
 * @returns Tendance
 */
export const calculateAttendanceTrend = (
  records: AttendanceRecord[]
): 'increasing' | 'decreasing' | 'stable' => {
  if (records.length < 3) return 'stable';

  // Compare les 3 derniers mois avec les 3 précédents
  const recentRecords = records.slice(-3);
  const previousRecords = records.slice(-6, -3);

  if (previousRecords.length === 0) return 'stable';

  const recentAvg = recentRecords.reduce((sum, r) => sum + r.pourcentage_de_cours_valides, 0) / recentRecords.length;
  const previousAvg = previousRecords.reduce((sum, r) => sum + r.pourcentage_de_cours_valides, 0) / previousRecords.length;

  const diff = recentAvg - previousAvg;

  if (diff > 5) return 'increasing';
  if (diff < -5) return 'decreasing';
  return 'stable';
};

/**
 * Calcule la série de présences actuelle (mois consécutifs > seuil)
 *
 * @param records - Données de fréquentation (triées par date)
 * @param threshold - Seuil de présence minimum (défaut: 80%)
 * @returns Nombre de mois consécutifs
 */
export const calculateCurrentStreak = (records: AttendanceRecord[], threshold: number = 80): number => {
  if (records.length === 0) return 0;

  let streak = 0;
  // Parcourir du plus récent au plus ancien
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].pourcentage_de_cours_valides >= threshold) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Calcule la plus longue série de présences
 *
 * @param records - Données de fréquentation
 * @param threshold - Seuil de présence minimum (défaut: 80%)
 * @returns Nombre de mois consécutifs (record)
 */
export const calculateLongestStreak = (records: AttendanceRecord[], threshold: number = 80): number => {
  if (records.length === 0) return 0;

  let longestStreak = 0;
  let currentStreak = 0;

  records.forEach((record) => {
    if (record.pourcentage_de_cours_valides >= threshold) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return longestStreak;
};

/**
 * Calcule toutes les statistiques de fréquentation
 *
 * @param records - Données de fréquentation
 * @returns Statistiques complètes
 */
export const calculateAttendanceStats = (records: AttendanceRecord[]): AttendanceStats => {
  return {
    totalPresences: calculateTotalAttendance(records),
    averageAttendanceRate: calculateAverageAttendanceRate(records),
    bestMonth: getBestAttendanceMonth(records),
    worstMonth: getWorstAttendanceMonth(records),
    trend: calculateAttendanceTrend(records),
    currentStreak: calculateCurrentStreak(records),
    longestStreak: calculateLongestStreak(records),
  };
};

// ============================================================================
// Formatting & Display
// ============================================================================

/**
 * Formate le nom du mois à partir d'une date
 *
 * @param monthString - Mois au format "YYYY-MM" ou texte
 * @returns Mois formaté (ex: "Janvier 2024")
 */
export const formatMonthName = (monthString: string): string => {
  // Si déjà au format texte, retourne tel quel
  if (!monthString.match(/^\d{4}-\d{2}$/)) {
    return monthString;
  }

  const [year, month] = monthString.split('-');
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const monthIndex = parseInt(month, 10) - 1;
  return `${monthNames[monthIndex]} ${year}`;
};

/**
 * Formate le taux de présence avec %
 *
 * @param rate - Taux en pourcentage
 * @param decimals - Nombre de décimales (défaut: 1)
 * @returns Taux formaté (ex: "85.5%")
 */
export const formatAttendanceRate = (rate: number, decimals: number = 1): string => {
  return `${rate.toFixed(decimals)}%`;
};

/**
 * Détermine la couleur du badge selon le taux de présence
 *
 * @param rate - Taux en pourcentage
 * @returns Variant de couleur
 */
export const getAttendanceRateColor = (
  rate: number
): 'success' | 'warning' | 'danger' | 'default' => {
  if (rate >= 90) return 'success';
  if (rate >= 75) return 'warning';
  if (rate >= 50) return 'danger';
  return 'default';
};

/**
 * Formate la tendance pour affichage
 *
 * @param trend - Tendance calculée
 * @returns { label: string, icon: string, color: string }
 */
export const formatTrend = (
  trend: 'increasing' | 'decreasing' | 'stable'
): { label: string; icon: string; color: string } => {
  const trendMap = {
    increasing: { label: 'En hausse', icon: '↗', color: 'green' },
    decreasing: { label: 'En baisse', icon: '↘', color: 'red' },
    stable: { label: 'Stable', icon: '→', color: 'blue' },
  };

  return trendMap[trend];
};

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Trie les enregistrements par date
 *
 * @param records - Données de fréquentation
 * @param order - Ordre de tri ('asc' | 'desc')
 * @returns Enregistrements triés
 */
export const sortRecordsByDate = (
  records: AttendanceRecord[],
  order: 'asc' | 'desc' = 'asc'
): AttendanceRecord[] => {
  return [...records].sort((a, b) => {
    const comparison = a.mois.localeCompare(b.mois);
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Filtre les enregistrements par période
 *
 * @param records - Données de fréquentation
 * @param startMonth - Mois de début (format: "YYYY-MM")
 * @param endMonth - Mois de fin (format: "YYYY-MM")
 * @returns Enregistrements filtrés
 */
export const filterRecordsByPeriod = (
  records: AttendanceRecord[],
  startMonth?: string,
  endMonth?: string
): AttendanceRecord[] => {
  return records.filter((record) => {
    if (startMonth && record.mois < startMonth) return false;
    if (endMonth && record.mois > endMonth) return false;
    return true;
  });
};

/**
 * Groupe les enregistrements par année
 *
 * @param records - Données de fréquentation
 * @returns Map année -> enregistrements
 */
export const groupRecordsByYear = (records: AttendanceRecord[]): Record<string, AttendanceRecord[]> => {
  return records.reduce((acc, record) => {
    const year = record.mois.split('-')[0] || new Date().getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);
};

/**
 * Compare la fréquentation année par année
 *
 * @param records - Données de fréquentation
 * @returns Comparaisons mensuelles
 */
export const compareYearOverYear = (records: AttendanceRecord[]): MonthlyComparison[] => {
  const grouped = groupRecordsByYear(records);
  const years = Object.keys(grouped).sort();

  if (years.length < 2) return [];

  const currentYear = years[years.length - 1];
  const previousYear = years[years.length - 2];

  const currentRecords = grouped[currentYear];
  const previousRecords = grouped[previousYear];

  const comparisons: MonthlyComparison[] = [];

  currentRecords.forEach((current) => {
    const monthNumber = current.mois.split('-')[1];
    const previous = previousRecords.find((r) => r.mois.split('-')[1] === monthNumber);

    if (previous) {
      const change = current.frequentation - previous.frequentation;
      const changePercentage = previous.frequentation > 0
        ? ((change / previous.frequentation) * 100)
        : 0;

      comparisons.push({
        month: formatMonthName(current.mois),
        currentYear: current.frequentation,
        previousYear: previous.frequentation,
        change,
        changePercentage: Math.round(changePercentage * 10) / 10,
      });
    }
  });

  return comparisons;
};

// ============================================================================
// Performance Analysis
// ============================================================================

/**
 * Identifie les périodes de faible fréquentation
 *
 * @param records - Données de fréquentation
 * @param threshold - Seuil en-dessous duquel c'est "faible" (défaut: 70%)
 * @returns Enregistrements sous le seuil
 */
export const identifyLowAttendancePeriods = (
  records: AttendanceRecord[],
  threshold: number = 70
): AttendanceRecord[] => {
  return records.filter((record) => record.pourcentage_de_cours_valides < threshold);
};

/**
 * Identifie les périodes de forte fréquentation
 *
 * @param records - Données de fréquentation
 * @param threshold - Seuil au-dessus duquel c'est "forte" (défaut: 90%)
 * @returns Enregistrements au-dessus du seuil
 */
export const identifyHighAttendancePeriods = (
  records: AttendanceRecord[],
  threshold: number = 90
): AttendanceRecord[] => {
  return records.filter((record) => record.pourcentage_de_cours_valides >= threshold);
};

/**
 * Calcule la régularité de la fréquentation (écart-type)
 *
 * @param records - Données de fréquentation
 * @returns Écart-type du taux de présence
 */
export const calculateAttendanceConsistency = (records: AttendanceRecord[]): number => {
  if (records.length === 0) return 0;

  const mean = calculateAverageAttendanceRate(records);
  const squaredDiffs = records.map((r) =>
    Math.pow(r.pourcentage_de_cours_valides - mean, 2)
  );
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / records.length;
  const standardDeviation = Math.sqrt(variance);

  return Math.round(standardDeviation * 10) / 10;
};

// ============================================================================
// Export all
// ============================================================================

export default {
  // Calculations
  calculateTotalAttendance,
  calculateAverageAttendanceRate,
  getBestAttendanceMonth,
  getWorstAttendanceMonth,
  calculateAttendanceTrend,
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateAttendanceStats,

  // Formatting
  formatMonthName,
  formatAttendanceRate,
  getAttendanceRateColor,
  formatTrend,

  // Transformation
  sortRecordsByDate,
  filterRecordsByPeriod,
  groupRecordsByYear,
  compareYearOverYear,

  // Analysis
  identifyLowAttendancePeriods,
  identifyHighAttendancePeriods,
  calculateAttendanceConsistency,
};
