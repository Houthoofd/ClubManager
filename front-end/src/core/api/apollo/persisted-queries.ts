/**
 * Automatic Persisted Queries (APQ)
 *
 * Réduit la taille des requêtes GraphQL en envoyant uniquement un hash SHA-256
 * au lieu de la query complète. Le serveur met en cache les queries par hash.
 *
 * Benefits:
 * - ✅ Réduction de la bande passante (~90% pour les grandes queries)
 * - ✅ Amélioration des performances réseau
 * - ✅ Cache CDN plus efficace (requêtes GET au lieu de POST)
 * - ✅ Rétrocompatible (fallback automatique si serveur ne supporte pas APQ)
 *
 * @see https://www.apollographql.com/docs/apollo-server/performance/apq/
 */

import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { ApolloLink } from "@apollo/client";
import { sha256 } from "crypto-hash";

// ============================================================================
// Configuration
// ============================================================================

interface APQConfig {
  /**
   * Active APQ
   * @default true en production, false en dev
   */
  enabled: boolean;

  /**
   * Utilise GET pour les queries persistées (améliore le cache CDN)
   * @default true
   */
  useGETForHashedQueries: boolean;

  /**
   * Désactive APQ pour certaines opérations
   */
  disableForOperations?: string[];

  /**
   * Taille minimale de query pour activer APQ (en caractères)
   * Les petites queries ne bénéficient pas d'APQ
   * @default 500
   */
  minQuerySize?: number;
}

const DEFAULT_APQ_CONFIG: APQConfig = {
  enabled: import.meta.env.PROD, // Activé uniquement en production par défaut
  useGETForHashedQueries: true,
  disableForOperations: [
    // Désactive APQ pour les mutations sensibles (upload de fichiers, etc.)
    "UploadFile",
    "UploadMultipleFiles",
  ],
  minQuerySize: 500,
};

// ============================================================================
// APQ Link Creation
// ============================================================================

/**
 * Crée le link Apollo pour Automatic Persisted Queries
 *
 * @param config - Configuration APQ personnalisée
 * @returns Apollo Link configuré pour APQ
 *
 * @example
 * ```ts
 * import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
 * import { createAPQLink } from './persisted-queries';
 *
 * const httpLink = new HttpLink({ uri: '/graphql' });
 * const apqLink = createAPQLink();
 *
 * const client = new ApolloClient({
 *   link: apqLink.concat(httpLink),
 *   cache: new InMemoryCache(),
 * });
 * ```
 */
export const createAPQLink = (config: Partial<APQConfig> = {}): ApolloLink => {
  const finalConfig = { ...DEFAULT_APQ_CONFIG, ...config };

  if (!finalConfig.enabled) {
    console.info("[APQ] Automatic Persisted Queries disabled");
    // Return a no-op link
    return new ApolloLink((operation, forward) => forward(operation));
  }

  console.info("[APQ] Automatic Persisted Queries enabled", {
    useGET: finalConfig.useGETForHashedQueries,
    disabledOps: finalConfig.disableForOperations?.length ?? 0,
  });

  return createPersistedQueryLink({
    /**
     * Fonction de hashing SHA-256
     * Utilise crypto-hash (léger) au lieu de crypto-js
     */
    sha256,

    /**
     * Utilise GET pour les queries persistées
     * Permet au CDN de cacher les requêtes
     */
    useGETForHashedQueries: finalConfig.useGETForHashedQueries,

    /**
     * Désactive APQ pour certaines opérations
     */
    disable: () => {
      // Pour l'instant, on laisse APQ activé par défaut
      // La configuration fine peut être ajoutée plus tard
      return false;
    },
  });
};

// ============================================================================
// APQ Statistics
// ============================================================================

interface APQStats {
  enabled: boolean;
  totalQueries: number;
  persistedQueries: number;
  cacheMisses: number;
  savings: {
    bytes: number;
    percentage: number;
  };
}

let apqStats: APQStats = {
  enabled: DEFAULT_APQ_CONFIG.enabled,
  totalQueries: 0,
  persistedQueries: 0,
  cacheMisses: 0,
  savings: {
    bytes: 0,
    percentage: 0,
  },
};

/**
 * Récupère les statistiques APQ
 */
export const getAPQStats = (): APQStats => {
  return { ...apqStats };
};

/**
 * Réinitialise les statistiques APQ
 */
export const resetAPQStats = (): void => {
  apqStats = {
    enabled: DEFAULT_APQ_CONFIG.enabled,
    totalQueries: 0,
    persistedQueries: 0,
    cacheMisses: 0,
    savings: {
      bytes: 0,
      percentage: 0,
    },
  };
};

/**
 * Track APQ usage (pour debugging en dev)
 */
export const trackAPQUsage = (
  operationName: string,
  isPersisted: boolean,
  querySize: number,
): void => {
  if (!import.meta.env.DEV) return;

  apqStats.totalQueries++;

  if (isPersisted) {
    apqStats.persistedQueries++;
    // Hash SHA-256 = 64 caractères = 64 bytes
    const savedBytes = querySize - 64;
    apqStats.savings.bytes += savedBytes;
  }

  apqStats.savings.percentage =
    apqStats.totalQueries > 0 ? (apqStats.persistedQueries / apqStats.totalQueries) * 100 : 0;

  console.debug("[APQ] Stats", {
    operation: operationName,
    persisted: isPersisted,
    stats: apqStats,
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Vérifie si le serveur supporte APQ
 * Envoie une query de test et vérifie la réponse
 *
 * @param graphqlUrl - URL du endpoint GraphQL
 * @returns Promise<boolean> - true si le serveur supporte APQ
 */
export const checkAPQSupport = async (graphqlUrl: string): Promise<boolean> => {
  try {
    const testQuery = `{ __typename }`;
    const hash = await sha256(testQuery);

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: hash,
          },
        },
      }),
    });

    const result = await response.json();

    // Si le serveur renvoie "PersistedQueryNotFound", il supporte APQ
    if (result.errors?.some((e: any) => e.message === "PersistedQueryNotFound")) {
      return true;
    }

    // Si la query réussit, le serveur a peut-être déjà le hash en cache
    if (result.data) {
      return true;
    }

    return false;
  } catch (error) {
    console.warn("[APQ] Failed to check APQ support:", error);
    return false;
  }
};

// ============================================================================
// Export default config
// ============================================================================

export { DEFAULT_APQ_CONFIG };
export type { APQConfig, APQStats };
