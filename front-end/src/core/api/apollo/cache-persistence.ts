/**
 * Apollo Cache Persistence
 *
 * Persiste le cache Apollo dans localStorage pour améliorer les temps de chargement.
 * Le cache est restauré au démarrage de l'application.
 *
 * Benefits:
 * - ✅ Chargement instantané des données en cache
 * - ✅ Expérience offline améliorée
 * - ✅ Réduction des appels réseau au premier chargement
 * - ✅ Gestion automatique de la taille et expiration
 *
 * @see https://www.apollographql.com/docs/react/caching/advanced-topics/#cache-persistence
 */

import type { ApolloCache, NormalizedCacheObject } from "@apollo/client";
import { logger } from "@/core/utils/appLogger";

// ============================================================================
// Configuration
// ============================================================================

const CACHE_PERSISTENCE_CONFIG = {
  /**
   * Clé localStorage pour stocker le cache
   */
  STORAGE_KEY: "apollo-cache-persist",

  /**
   * Version du schéma de cache (incrémente pour invalider le cache existant)
   */
  SCHEMA_VERSION: "1.0",

  /**
   * Clé pour stocker la version du schéma
   */
  VERSION_KEY: "apollo-cache-version",

  /**
   * Clé pour stocker le timestamp de dernière sauvegarde
   */
  TIMESTAMP_KEY: "apollo-cache-timestamp",

  /**
   * Durée de validité du cache (en ms)
   * Default: 7 jours
   */
  MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,

  /**
   * Taille maximale du cache (en bytes)
   * Default: 5MB (localStorage limite généralement à 5-10MB)
   */
  MAX_SIZE_BYTES: 5 * 1024 * 1024,

  /**
   * Délai de debounce pour les sauvegardes (en ms)
   * Évite de sauvegarder trop fréquemment
   */
  SAVE_DEBOUNCE_MS: 1000,

  /**
   * Queries/Fragments à exclure de la persistence
   * (données sensibles ou temporaires)
   */
  EXCLUDE_PATTERNS: [
    "CurrentUser", // Données de session
    "AuthToken", // Tokens d'authentification
    "temp-", // IDs temporaires (optimistic updates)
  ],
} as const;

// ============================================================================
// Types
// ============================================================================

interface CacheMetadata {
  version: string;
  timestamp: number;
  size: number;
}

interface PersistenceStats {
  enabled: boolean;
  lastSaved: Date | null;
  cacheSize: number;
  isExpired: boolean;
}

// ============================================================================
// Storage Helpers
// ============================================================================

/**
 * Vérifie si localStorage est disponible
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = "__apollo_cache_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Calcule la taille d'une string en bytes
 */
const getStringSize = (str: string): number => {
  return new Blob([str]).size;
};

/**
 * Récupère les métadonnées du cache persisté
 */
const getCacheMetadata = (): CacheMetadata | null => {
  try {
    const version = localStorage.getItem(CACHE_PERSISTENCE_CONFIG.VERSION_KEY);
    const timestamp = localStorage.getItem(CACHE_PERSISTENCE_CONFIG.TIMESTAMP_KEY);

    if (!version || !timestamp) {
      return null;
    }

    const cacheData = localStorage.getItem(CACHE_PERSISTENCE_CONFIG.STORAGE_KEY);
    const size = cacheData ? getStringSize(cacheData) : 0;

    return {
      version,
      timestamp: parseInt(timestamp, 10),
      size,
    };
  } catch (error) {
    logger.warn("Failed to get Apollo cache metadata", {
      feature: "apollo-cache",
      metadata: { error },
    });
    return null;
  }
};

/**
 * Vérifie si le cache est expiré
 */
const isCacheExpired = (metadata: CacheMetadata | null): boolean => {
  if (!metadata) return true;

  const now = Date.now();
  const age = now - metadata.timestamp;

  return age > CACHE_PERSISTENCE_CONFIG.MAX_AGE_MS;
};

/**
 * Vérifie si le cache est compatible avec la version actuelle
 */
const isCacheVersionValid = (metadata: CacheMetadata | null): boolean => {
  if (!metadata) return false;
  return metadata.version === CACHE_PERSISTENCE_CONFIG.SCHEMA_VERSION;
};

/**
 * Nettoie les données sensibles du cache avant persistence
 */
const sanitizeCacheData = (cacheData: string): string => {
  try {
    const parsed = JSON.parse(cacheData);

    // Supprime les patterns exclus
    if (parsed && typeof parsed === "object") {
      const sanitized = { ...parsed };

      CACHE_PERSISTENCE_CONFIG.EXCLUDE_PATTERNS.forEach((pattern) => {
        Object.keys(sanitized).forEach((key) => {
          if (key.includes(pattern)) {
            delete sanitized[key];
          }
        });
      });

      return JSON.stringify(sanitized);
    }

    return cacheData;
  } catch {
    return cacheData;
  }
};

// ============================================================================
// Core Persistence Functions
// ============================================================================

/**
 * Restaure le cache Apollo depuis localStorage
 *
 * @returns Le cache restauré ou null si invalide/expiré
 */
export const restoreCacheFromStorage = (): NormalizedCacheObject | null => {
  if (!isLocalStorageAvailable()) {
    logger.warn("localStorage not available for Apollo cache", {
      feature: "apollo-cache",
    });
    return null;
  }

  try {
    const metadata = getCacheMetadata();

    // Vérifie la validité du cache
    if (!isCacheVersionValid(metadata)) {
      logger.info("Apollo cache version mismatch, clearing old cache", {
        feature: "apollo-cache",
      });
      clearPersistedCache();
      return null;
    }

    if (isCacheExpired(metadata)) {
      logger.info("Apollo cache expired, clearing old cache", {
        feature: "apollo-cache",
      });
      clearPersistedCache();
      return null;
    }

    // Restaure le cache
    const cacheData = localStorage.getItem(CACHE_PERSISTENCE_CONFIG.STORAGE_KEY);
    if (!cacheData) {
      return null;
    }

    const parsedCache = JSON.parse(cacheData) as NormalizedCacheObject;
    logger.info("Apollo cache restored from localStorage", {
      feature: "apollo-cache",
      metadata: {
        size: metadata?.size,
        age: metadata ? Date.now() - metadata.timestamp : 0,
      },
    });

    return parsedCache;
  } catch (error) {
    logger.error("Failed to restore Apollo cache", error as Error, {
      feature: "apollo-cache",
    });
    clearPersistedCache();
    return null;
  }
};

/**
 * Persiste le cache Apollo dans localStorage
 *
 * @param cache - Le cache Apollo à persister
 */
export const persistCacheToStorage = (cache: ApolloCache<NormalizedCacheObject>): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const cacheData = cache.extract();
    const serialized = JSON.stringify(cacheData);
    const sanitized = sanitizeCacheData(serialized);
    const size = getStringSize(sanitized);

    // Vérifie la taille max
    if (size > CACHE_PERSISTENCE_CONFIG.MAX_SIZE_BYTES) {
      logger.warn("Apollo cache too large to persist", {
        feature: "apollo-cache",
        metadata: {
          size,
          maxSize: CACHE_PERSISTENCE_CONFIG.MAX_SIZE_BYTES,
        },
      });
      return;
    }

    // Sauvegarde le cache
    localStorage.setItem(CACHE_PERSISTENCE_CONFIG.STORAGE_KEY, sanitized);
    localStorage.setItem(
      CACHE_PERSISTENCE_CONFIG.VERSION_KEY,
      CACHE_PERSISTENCE_CONFIG.SCHEMA_VERSION,
    );
    localStorage.setItem(CACHE_PERSISTENCE_CONFIG.TIMESTAMP_KEY, Date.now().toString());

    logger.debug("Apollo cache persisted to localStorage", {
      feature: "apollo-cache",
      metadata: { size },
    });
  } catch (error) {
    logger.error("Failed to persist Apollo cache", error as Error, {
      feature: "apollo-cache",
    });

    // Si erreur de quota, essaye de nettoyer
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      logger.warn("localStorage quota exceeded, clearing Apollo cache", {
        feature: "apollo-cache",
      });
      clearPersistedCache();
    }
  }
};

/**
 * Efface le cache persisté
 */
export const clearPersistedCache = (): void => {
  try {
    localStorage.removeItem(CACHE_PERSISTENCE_CONFIG.STORAGE_KEY);
    localStorage.removeItem(CACHE_PERSISTENCE_CONFIG.VERSION_KEY);
    localStorage.removeItem(CACHE_PERSISTENCE_CONFIG.TIMESTAMP_KEY);
    logger.info("Apollo persisted cache cleared", {
      feature: "apollo-cache",
    });
  } catch (error) {
    logger.error("Failed to clear Apollo persisted cache", error as Error, {
      feature: "apollo-cache",
    });
  }
};

/**
 * Récupère les statistiques de persistence
 */
export const getPersistenceStats = (): PersistenceStats => {
  const metadata = getCacheMetadata();

  return {
    enabled: isLocalStorageAvailable(),
    lastSaved: metadata ? new Date(metadata.timestamp) : null,
    cacheSize: metadata?.size ?? 0,
    isExpired: isCacheExpired(metadata),
  };
};

// ============================================================================
// Auto-Save avec Debounce
// ============================================================================

let saveTimeout: NodeJS.Timeout | null = null;

/**
 * Sauvegarde le cache avec debounce
 * Évite de sauvegarder trop fréquemment
 *
 * @param cache - Le cache Apollo
 */
export const debouncedPersistCache = (cache: ApolloCache<NormalizedCacheObject>): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    persistCacheToStorage(cache);
    saveTimeout = null;
  }, CACHE_PERSISTENCE_CONFIG.SAVE_DEBOUNCE_MS);
};

/**
 * Force la sauvegarde immédiate (flush le debounce)
 *
 * @param cache - Le cache Apollo
 */
export const flushPersistCache = (cache: ApolloCache<NormalizedCacheObject>): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  persistCacheToStorage(cache);
};

// ============================================================================
// Setup Hook
// ============================================================================

/**
 * Configure la persistence automatique du cache Apollo
 *
 * @param cache - Le cache Apollo
 * @returns Fonction de cleanup
 *
 * @example
 * ```ts
 * import { InMemoryCache } from '@apollo/client';
 * import { setupCachePersistence, restoreCacheFromStorage } from './cache-persistence';
 *
 * // 1. Restaure le cache au démarrage
 * const restoredCache = restoreCacheFromStorage();
 *
 * // 2. Crée le cache Apollo
 * const cache = new InMemoryCache({
 *   ...config,
 * }).restore(restoredCache || {});
 *
 * // 3. Active la persistence automatique
 * const cleanup = setupCachePersistence(cache);
 *
 * // 4. Cleanup au unmount (si nécessaire)
 * // cleanup();
 * ```
 */
export const setupCachePersistence = (cache: ApolloCache<NormalizedCacheObject>): (() => void) => {
  if (!isLocalStorageAvailable()) {
    logger.warn("[Apollo Cache] Persistence disabled: localStorage not available");
    return () => {};
  }

  logger.info("[Apollo Cache] Persistence enabled");

  // Sauvegarde à chaque modification du cache (avec debounce)
  const broadcastHandler = () => {
    debouncedPersistCache(cache);
  };

  // Écoute les changements du cache
  // Note: Apollo n'expose pas directement d'événement "onChange"
  // On utilise un watcher ou on trigger manuellement après les mutations

  // Sauvegarde avant fermeture de la page
  const beforeUnloadHandler = () => {
    flushPersistCache(cache);
  };

  window.addEventListener("beforeunload", beforeUnloadHandler);

  // Sauvegarde périodique (toutes les 30 secondes)
  const intervalId = setInterval(() => {
    persistCacheToStorage(cache);
  }, 30000);

  // Fonction de cleanup
  return () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    clearInterval(intervalId);
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    logger.info("[Apollo Cache] Persistence cleanup completed");
  };
};

// ============================================================================
// Export Configuration (pour override si nécessaire)
// ============================================================================

export { CACHE_PERSISTENCE_CONFIG };
