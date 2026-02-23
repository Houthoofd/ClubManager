/**
 * Chart Components - Barrel Export
 *
 * ⚡ Performance: Tous les composants graphiques utilisent le lazy loading
 * pour ne charger Recharts (~335KB) que quand nécessaire
 *
 * @example
 * ```tsx
 * import { GraphiqueLineaire, GraphiquePie, ChartCard } from '@/features/stats/components/charts';
 *
 * // Recharts est chargé uniquement quand le composant est rendu
 * <GraphiqueLineaire data={data} series={series} xAxisKey="month" />
 * <GraphiquePie data={pieData} serie={serie} />
 * <ChartCard title="Stats" data={data} type="line" />
 * ```
 */

// Export des versions lazy-loaded par défaut (recommandé)
export { default as GraphiqueLineaire } from './GraphiqueLineaire.lazy';
export { default as GraphiquePie } from './GraphiquePie.lazy';
export { ChartCard } from './ChartCard.lazy';

// Export des versions eager si nécessaire (cas exceptionnels où le lazy loading n'est pas souhaité)
export { default as GraphiqueLineaireEager } from './GraphiqueLineaire';
export { default as GraphiquePieEager } from './GraphiquePie';
export { ChartCard as ChartCardEager } from './ChartCard';
