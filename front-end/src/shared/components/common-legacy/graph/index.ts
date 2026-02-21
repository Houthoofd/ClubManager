/**
 * Graph Components - Barrel Export
 *
 * ⚡ Performance: Les composants graphiques utilisent le lazy loading
 * pour ne charger Recharts (~280KB) que quand nécessaire
 *
 * @example
 * ```tsx
 * import { GraphiqueLineaire, GraphiquePie } from '@/shared/components/common-legacy/graph';
 *
 * // Recharts est chargé uniquement quand le composant est rendu
 * <GraphiqueLineaire data={data} series={series} xAxisKey="month" />
 * ```
 */

// Export des versions lazy-loaded par défaut (recommandé)
export { default as GraphiqueLineaire } from './GraphiqueLineaire.lazy';
export { default as GraphiquePie } from './GraphiquePie.lazy';

// Export des versions eager si nécessaire (cas exceptionnels)
export { default as GraphiqueLineaireEager } from './GraphiqueLineaire';
export { default as GraphiquePieEager } from './GraphiquePie';
