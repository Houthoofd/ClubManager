/**
 * Graph Components - DEPRECATED
 *
 * ⚠️ DÉPRÉCIÉ: Ces composants ont été déplacés vers @/features/stats/components/charts
 *
 * Ce fichier maintient la compatibilité ascendante mais sera supprimé dans une version future.
 * Veuillez mettre à jour vos imports pour utiliser le nouveau chemin.
 *
 * @deprecated Utilisez `@/features/stats/components/charts` à la place
 *
 * @example Migration
 * ```tsx
 * // ❌ Ancien (déprécié)
 * import { GraphiqueLineaire, GraphiquePie } from '@/shared/components/common-legacy/graph';
 *
 * // ✅ Nouveau (recommandé)
 * import { GraphiqueLineaire, GraphiquePie } from '@/features/stats/components/charts';
 * ```
 *
 * @see {@link @/features/stats/components/charts} pour la nouvelle implémentation
 */

// Log de dépréciation en développement
if (import.meta.env.DEV) {
  console.warn(
    "⚠️ DÉPRÉCIATION: Import depuis @/shared/components/common-legacy/graph est déprécié.\n" +
      "Veuillez utiliser @/features/stats/components/charts à la place.\n" +
      "Ce chemin sera supprimé dans une version future.",
  );
}

// Export des versions lazy-loaded par défaut (recommandé)
export { default as GraphiqueLineaire } from "./GraphiqueLineaire.lazy";
export { default as GraphiquePie } from "./GraphiquePie.lazy";

// Export des versions eager si nécessaire (cas exceptionnels)
export { default as GraphiqueLineaireEager } from "./GraphiqueLineaire";
export { default as GraphiquePieEager } from "./GraphiquePie";
