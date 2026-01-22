import { Prisma } from '@prisma/client';

/**
 * Context tenant - à définir dans le contexte de la requête
 */
let currentTenantId: string | null = null;

/**
 * Définir le tenant courant pour le contexte d'exécution
 */
export function setCurrentTenantId(tenantId: string | null): void {
  currentTenantId = tenantId;
}

/**
 * Récupérer le tenant courant
 */
export function getCurrentTenantId(): string | null {
  return currentTenantId;
}

/**
 * Effacer le contexte tenant
 */
export function clearCurrentTenantId(): void {
  currentTenantId = null;
}

/**
 * Liste des modèles qui nécessitent une isolation par tenant
 * Les tables de référence (Genre, Status, Grade, PlanTarifaire, Taille, AlerteType, MessagePersonnalise)
 * ne sont PAS incluses car elles sont partagées entre tous les tenants
 */
const TENANT_ISOLATED_MODELS = [
  'User',
  'Cours',
  'Paiement',
  'EcheancePaiement',
  'Article',
  'Commande',
  'Message',
  'Notification',
  'Groupe',
  'AlerteUtilisateur',
  'AuditLog',
];

/**
 * Middleware Prisma pour l'isolation automatique par tenant
 *
 * Ce middleware intercepte toutes les requêtes Prisma et:
 * 1. Ajoute automatiquement le filtre tenantId sur les requêtes de lecture
 * 2. Ajoute automatiquement le tenantId sur les requêtes de création
 * 3. Empêche les modifications/suppressions cross-tenant
 *
 * ⚠️ CRITIQUE POUR LA SÉCURITÉ MULTI-TENANT
 */
export function tenantIsolationMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const { model, action } = params;

    // Ignorer les modèles qui ne sont pas isolés par tenant
    if (!model || !TENANT_ISOLATED_MODELS.includes(model)) {
      return next(params);
    }

    // Récupérer le tenant courant
    const tenantId = getCurrentTenantId();

    // ⚠️ SÉCURITÉ: Bloquer toute requête sans contexte tenant
    if (!tenantId) {
      throw new Error(
        `SECURITY: Attempted to access ${model} without tenant context. This is blocked for security.`
      );
    }

    // ========================================
    // REQUÊTES DE LECTURE (findMany, findFirst, findUnique, count, aggregate)
    // ========================================
    if (
      action === 'findMany' ||
      action === 'findFirst' ||
      action === 'findUnique' ||
      action === 'count' ||
      action === 'aggregate' ||
      action === 'groupBy'
    ) {
      // Forcer le filtre tenantId
      params.args = params.args || {};
      params.args.where = params.args.where || {};

      // Si un tenantId est déjà présent dans le where, vérifier qu'il correspond
      if (params.args.where.tenantId && params.args.where.tenantId !== tenantId) {
        throw new Error(
          `SECURITY: Attempted to access ${model} from tenant ${params.args.where.tenantId} while authenticated as tenant ${tenantId}`
        );
      }

      // Ajouter le filtre tenantId
      params.args.where.tenantId = tenantId;
    }

    // ========================================
    // REQUÊTES DE CRÉATION (create, createMany)
    // ========================================
    if (action === 'create') {
      params.args = params.args || {};
      params.args.data = params.args.data || {};

      // Si un tenantId est déjà présent, vérifier qu'il correspond
      if (params.args.data.tenantId && params.args.data.tenantId !== tenantId) {
        throw new Error(
          `SECURITY: Attempted to create ${model} for tenant ${params.args.data.tenantId} while authenticated as tenant ${tenantId}`
        );
      }

      // Forcer le tenantId
      params.args.data.tenantId = tenantId;
    }

    if (action === 'createMany') {
      params.args = params.args || {};
      params.args.data = params.args.data || [];

      // Forcer le tenantId sur tous les enregistrements
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((record: any) => {
          if (record.tenantId && record.tenantId !== tenantId) {
            throw new Error(
              `SECURITY: Attempted to create ${model} for tenant ${record.tenantId} while authenticated as tenant ${tenantId}`
            );
          }
          return { ...record, tenantId };
        });
      }
    }

    // ========================================
    // REQUÊTES DE MISE À JOUR (update, updateMany)
    // ========================================
    if (action === 'update' || action === 'updateMany') {
      params.args = params.args || {};
      params.args.where = params.args.where || {};

      // Forcer le filtre tenantId sur le where
      if (params.args.where.tenantId && params.args.where.tenantId !== tenantId) {
        throw new Error(
          `SECURITY: Attempted to update ${model} from tenant ${params.args.where.tenantId} while authenticated as tenant ${tenantId}`
        );
      }

      params.args.where.tenantId = tenantId;

      // Empêcher la modification du tenantId
      if (params.args.data?.tenantId && params.args.data.tenantId !== tenantId) {
        throw new Error(
          `SECURITY: Attempted to change tenantId on ${model}. This is not allowed.`
        );
      }
    }

    // ========================================
    // REQUÊTES DE SUPPRESSION (delete, deleteMany)
    // ========================================
    if (action === 'delete' || action === 'deleteMany') {
      params.args = params.args || {};
      params.args.where = params.args.where || {};

      // Forcer le filtre tenantId
      if (params.args.where.tenantId && params.args.where.tenantId !== tenantId) {
        throw new Error(
          `SECURITY: Attempted to delete ${model} from tenant ${params.args.where.tenantId} while authenticated as tenant ${tenantId}`
        );
      }

      params.args.where.tenantId = tenantId;
    }

    // ========================================
    // REQUÊTES UPSERT
    // ========================================
    if (action === 'upsert') {
      params.args = params.args || {};
      params.args.where = params.args.where || {};
      params.args.create = params.args.create || {};
      params.args.update = params.args.update || {};

      // Forcer le filtre tenantId sur le where
      params.args.where.tenantId = tenantId;

      // Forcer le tenantId sur create
      if (params.args.create.tenantId && params.args.create.tenantId !== tenantId) {
        throw new Error(
          `SECURITY: Attempted to upsert ${model} for tenant ${params.args.create.tenantId} while authenticated as tenant ${tenantId}`
        );
      }
      params.args.create.tenantId = tenantId;

      // Empêcher la modification du tenantId sur update
      if (params.args.update.tenantId && params.args.update.tenantId !== tenantId) {
        throw new Error(
          `SECURITY: Attempted to change tenantId on ${model} during upsert. This is not allowed.`
        );
      }
    }

    // Exécuter la requête
    return next(params);
  };
}

/**
 * Wrapper pour exécuter une fonction avec un contexte tenant spécifique
 * Utile pour les jobs async, migrations, etc.
 */
export async function withTenantContext<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  const previousTenantId = getCurrentTenantId();

  try {
    setCurrentTenantId(tenantId);
    return await fn();
  } finally {
    // Restaurer le contexte précédent
    if (previousTenantId) {
      setCurrentTenantId(previousTenantId);
    } else {
      clearCurrentTenantId();
    }
  }
}

/**
 * Wrapper pour désactiver temporairement l'isolation tenant
 * ⚠️ À UTILISER AVEC EXTRÊME PRUDENCE - Uniquement pour les opérations admin
 */
export async function withoutTenantIsolation<T>(
  fn: () => Promise<T>
): Promise<T> {
  const previousTenantId = getCurrentTenantId();

  try {
    clearCurrentTenantId();
    return await fn();
  } finally {
    if (previousTenantId) {
      setCurrentTenantId(previousTenantId);
    }
  }
}
