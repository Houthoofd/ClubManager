/**
 * Resolvers GraphQL pour le module Alertes
 * ✅ MIGRÉ : Utilise les middlewares partagés depuis @shared
 * - Erreurs GraphQL standardisées
 * - Auth middleware (requireAuth, requireAdmin)
 * - Validation middleware (withValidation)
 * - Audit logging middleware (withAuditLog)
 * - Rate limiting middleware (withRateLimit)
 * - Sentry monitoring middleware (withSentry)
 * - Services réutilisables
 */

import {
  requireAuth,
  requireAdmin,
  combineMiddlewares,
  type GraphQLContext,
} from "@/shared/middleware/auth.middleware.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "@/shared/errors/GraphQLErrors.js";
import { withValidation } from "@/shared/middleware/validation.middleware.js";
import { withAuditLog } from "@/shared/middleware/audit-log.middleware.js";
import {
  withRateLimit,
  RateLimitPresets,
} from "@/shared/middleware/rate-limit.middleware.js";
import { withSentry } from "@/shared/middleware/sentry.middleware.js";
import {
  AuditEventType,
  AuditSeverity,
} from "@/shared/services/audit-log.service.js";

// Services
import {
  obtenirDashboardAlertes,
  obtenirAlertesActives,
  obtenirAlertesUtilisateur,
  detecterAlertes,
  resoudreAlerte,
  ignorerAlerte,
  obtenirAlerteParId,
  type AlerteDashboard,
  type AlerteData,
} from "../services/alertes.service.js";

// Validators depuis @clubmanager/types
import {
  obtenirAlerteSchema,
  obtenirAlertesUtilisateurSchema,
  resoudreAlerteSchema,
  ignorerAlerteSchema,
} from '@clubmanager/types/domains/alertes/validators';

/**
 * Interface pour les arguments GraphQL
 */
interface ObtenirAlertesUtilisateurArgs {
  userId: number;
}

interface ResoudreAlerteArgs {
  alerteId: number;
  notes?: string;
}

interface IgnorerAlerteArgs {
  alerteId: number;
  notes?: string;
}

interface ObtenirAlerteArgs {
  id: number;
}

/**
 * Resolvers GraphQL pour Alertes
 */
export const alertesResolvers = {
  Query: {
    /**
     * ✅ Récupérer le dashboard des alertes (Admin uniquement)
     * @requires Admin
     * @rateLimit 100 requests / 15 minutes
     * @audit DATA_ACCESSED
     */
    alertesDashboard: combineMiddlewares(
      requireAdmin,
      withSentry,
      withRateLimit(RateLimitPresets.QUERY),
      withAuditLog({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.INFO,
        resource: "alertes",
      }),
    )(
      async (
        _parent: any,
        _args: any,
        _context: GraphQLContext,
      ): Promise<AlerteDashboard> => {
        console.log("🔍 [GraphQL] Query: alertesDashboard");
        return await obtenirDashboardAlertes();
      },
    ),

    /**
     * ✅ Récupérer toutes les alertes actives (Admin uniquement)
     * @requires Admin
     * @rateLimit 100 requests / 15 minutes
     * @audit DATA_ACCESSED
     */
    alertesActives: combineMiddlewares(
      requireAdmin,
      withSentry,
      withRateLimit(RateLimitPresets.QUERY),
      withAuditLog({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.INFO,
        resource: "alertes",
      }),
    )(
      async (
        _parent: any,
        _args: any,
        _context: GraphQLContext,
      ): Promise<AlerteData[]> => {
        console.log("🔍 [GraphQL] Query: alertesActives");
        return await obtenirAlertesActives();
      },
    ),

    /**
     * ✅ Récupérer les alertes d'un utilisateur spécifique (Admin uniquement)
     * @requires Admin
     * @validates obtenirAlertesUtilisateurSchema
     * @rateLimit 100 requests / 15 minutes
     * @audit DATA_ACCESSED
     */
    alertesUtilisateur: combineMiddlewares(
      requireAdmin,
      withSentry,
      withValidation(obtenirAlertesUtilisateurSchema),
      withRateLimit(RateLimitPresets.QUERY),
      withAuditLog({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.INFO,
        resource: "alertes",
      }),
    )(
      async (
        _parent: any,
        args: ObtenirAlertesUtilisateurArgs,
        _context: GraphQLContext,
      ): Promise<AlerteData[]> => {
        console.log("🔍 [GraphQL] Query: alertesUtilisateur", {
          userId: args.userId,
        });
        return await obtenirAlertesUtilisateur(args.userId);
      },
    ),

    /**
     * ✅ Récupérer une alerte par son ID (Admin uniquement)
     * @requires Admin
     * @validates obtenirAlerteSchema
     * @rateLimit 100 requests / 15 minutes
     * @audit DATA_ACCESSED
     */
    alerte: combineMiddlewares(
      requireAdmin,
      withSentry,
      withValidation(obtenirAlerteSchema),
      withRateLimit(RateLimitPresets.QUERY),
      withAuditLog({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.INFO,
        resource: "alertes",
      }),
    )(
      async (
        _parent: any,
        args: ObtenirAlerteArgs,
        _context: GraphQLContext,
      ): Promise<AlerteData> => {
        console.log("🔍 [GraphQL] Query: alerte", { id: args.id });

        const alerte = await obtenirAlerteParId(args.id);

        if (!alerte) {
          throw new NotFoundError(`Alerte ${args.id} non trouvée`);
        }

        return alerte;
      },
    ),
  },

  Mutation: {
    /**
     * ✅ Déclencher manuellement la détection des alertes (Admin uniquement)
     * @requires Admin
     * @rateLimit 10 requests / 1 hour (strict pour éviter les abus)
     * @audit ADMIN_SYSTEM_OPERATION
     */
    detecterAlertes: combineMiddlewares(
      requireAdmin,
      withSentry,
      withRateLimit({
        max: 10,
        windowMs: 60 * 60 * 1000, // 1 heure
        message: "Trop de détections d'alertes, veuillez réessayer plus tard",
      }),
      withAuditLog({
        eventType: AuditEventType.ADMIN_SYSTEM_OPERATION,
        severity: AuditSeverity.WARNING,
        resource: "alertes",
      }),
    )(
      async (
        _parent: any,
        _args: any,
        context: GraphQLContext,
      ): Promise<{ success: boolean; message: string }> => {
        console.log("🔧 [GraphQL] Mutation: detecterAlertes", {
          userId: context.user?.id,
        });

        return await detecterAlertes();
      },
    ),

    /**
     * ✅ Résoudre une alerte (Admin uniquement)
     * @requires Admin
     * @validates resoudreAlerteSchema
     * @rateLimit 50 requests / 15 minutes
     * @audit ADMIN_SYSTEM_OPERATION
     */
    resoudreAlerte: combineMiddlewares(
      requireAdmin,
      withSentry,
      withValidation(resoudreAlerteSchema),
      withRateLimit(RateLimitPresets.MUTATION),
      withAuditLog({
        eventType: AuditEventType.ADMIN_SYSTEM_OPERATION,
        severity: AuditSeverity.WARNING,
        resource: "alertes",
      }),
    )(
      async (
        _parent: any,
        args: ResoudreAlerteArgs,
        context: GraphQLContext,
      ): Promise<{ success: boolean; message: string }> => {
        console.log("🔧 [GraphQL] Mutation: resoudreAlerte", {
          alerteId: args.alerteId,
          userId: context.user?.id,
          hasNotes: !!args.notes,
        });

        return await resoudreAlerte(
          args.alerteId,
          args.notes || "",
          context.user?.id,
        );
      },
    ),

    /**
     * ✅ Ignorer une alerte (Admin uniquement)
     * @requires Admin
     * @validates ignorerAlerteSchema
     * @rateLimit 50 requests / 15 minutes
     * @audit ADMIN_SYSTEM_OPERATION
     */
    ignorerAlerte: combineMiddlewares(
      requireAdmin,
      withSentry,
      withValidation(ignorerAlerteSchema),
      withRateLimit(RateLimitPresets.MUTATION),
      withAuditLog({
        eventType: AuditEventType.ADMIN_SYSTEM_OPERATION,
        severity: AuditSeverity.WARNING,
        resource: "alertes",
      }),
    )(
      async (
        _parent: any,
        args: IgnorerAlerteArgs,
        context: GraphQLContext,
      ): Promise<{ success: boolean; message: string }> => {
        console.log("🔧 [GraphQL] Mutation: ignorerAlerte", {
          alerteId: args.alerteId,
          userId: context.user?.id,
          hasNotes: !!args.notes,
        });

        return await ignorerAlerte(args.alerteId, args.notes || "");
      },
    ),
  },
};

/**
 * Export default pour compatibilité
 */
export default alertesResolvers;
