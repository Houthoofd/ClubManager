/**
 * Service de gestion des alertes administrateur
 *
 * Permet de créer et gérer des alertes pour les événements critiques :
 * - Échecs de paiement
 * - Problèmes d'abonnement
 * - Erreurs système
 */

import { prisma } from "../database/prisma-client.js";
import * as Sentry from "@sentry/node";

// ============================================================================
// Types locaux (en attendant la résolution du package @clubmanager/types)
// ============================================================================

export enum AlertType {
  PAYMENT_FAILURE = "payment_failure",
  SUBSCRIPTION_SUSPENDED = "subscription_suspended",
  WEBHOOK_ERROR = "webhook_error",
  SYSTEM_ERROR = "system_error",
  USER_ISSUE = "user_issue",
}

export enum AlertPriority {
  BASSE = "basse",
  NORMALE = "normale",
  HAUTE = "haute",
  CRITIQUE = "critique",
}

export interface AlertContext {
  subscriptionId?: string;
  invoiceId?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  attemptCount?: number;
  error?: string;
  errorCode?: string;
  webhookEventId?: string;
  webhookEventType?: string;
  [key: string]: any;
}

export interface CreateAlertInput {
  utilisateurId: number;
  typeCode: AlertType | string;
  priority?: AlertPriority;
  context?: AlertContext;
  notes?: string;
}

export interface AlertStats {
  total: number;
  active: number;
  resolved: number;
  ignored?: number;
  byType: Array<{
    typeId: number;
    typeCode?: string;
    typeName?: string;
    count: number;
  }>;
  byPriority: Record<string, number>;
  recentAlerts?: any[];
}

export interface GetAlertsResult {
  alertes: any[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Obtenir le nom lisible du type d'alerte
 */
function getAlertTypeName(code: AlertType | string): string {
  const names: Record<string, string> = {
    [AlertType.PAYMENT_FAILURE]: "Échec de paiement",
    [AlertType.SUBSCRIPTION_SUSPENDED]: "Abonnement suspendu",
    [AlertType.WEBHOOK_ERROR]: "Erreur webhook",
    [AlertType.SYSTEM_ERROR]: "Erreur système",
    [AlertType.USER_ISSUE]: "Problème utilisateur",
  };
  return names[code] || code;
}

/**
 * Obtenir la description du type d'alerte
 */
function getAlertTypeDescription(code: AlertType | string): string {
  const descriptions: Record<string, string> = {
    [AlertType.PAYMENT_FAILURE]:
      "Échec lors de la tentative de paiement d'un utilisateur",
    [AlertType.SUBSCRIPTION_SUSPENDED]:
      "Abonnement utilisateur suspendu après échecs répétés",
    [AlertType.WEBHOOK_ERROR]: "Erreur lors du traitement d'un webhook Stripe",
    [AlertType.SYSTEM_ERROR]: "Erreur système nécessitant une intervention",
    [AlertType.USER_ISSUE]: "Problème détecté concernant un utilisateur",
  };
  return descriptions[code] || "";
}

// ============================================================================
// Service
// ============================================================================

export class AlertService {
  /**
   * Créer une nouvelle alerte utilisateur
   */
  async createAlert(input: CreateAlertInput): Promise<number | null> {
    try {
      console.log("🚨 [AlertService] Création alerte:", {
        utilisateurId: input.utilisateurId,
        type: input.typeCode,
        priority: input.priority,
      });

      // Récupérer ou créer le type d'alerte
      let alerteType = await prisma.alertes_types.findUnique({
        where: { code: input.typeCode },
      });

      if (!alerteType) {
        // Créer le type d'alerte s'il n'existe pas
        alerteType = await prisma.alertes_types.create({
          data: {
            code: input.typeCode,
            nom: getAlertTypeName(input.typeCode),
            description: getAlertTypeDescription(input.typeCode),
            priorite: input.priority || AlertPriority.NORMALE,
            actif: true,
          },
        });
      }

      // Créer l'alerte utilisateur
      const alerte = await prisma.alertes_utilisateurs.create({
        data: {
          utilisateur_id: input.utilisateurId,
          alerte_type_id: alerteType.id,
          statut: "active",
          donnees_contexte: input.context || {},
          date_detection: new Date(),
          notes: input.notes,
        },
      });

      console.log("✅ [AlertService] Alerte créée:", alerte.id);
      return alerte.id;
    } catch (error: any) {
      console.error("❌ [AlertService] Erreur création alerte:", error.message);
      Sentry.captureException(error, {
        tags: {
          service: "alert",
          action: "createAlert",
        },
        extra: { input: JSON.stringify(input) },
      });
      return null;
    }
  }

  /**
   * Créer une alerte pour échec de paiement
   */
  async createPaymentFailureAlert(
    utilisateurId: number,
    context: AlertContext,
  ): Promise<number | null> {
    return this.createAlert({
      utilisateurId,
      typeCode: AlertType.PAYMENT_FAILURE,
      priority: AlertPriority.HAUTE,
      context,
      notes: `Échec de paiement - ${context.attemptCount || 0} tentatives`,
    });
  }

  /**
   * Créer une alerte pour suspension d'abonnement
   */
  async createSubscriptionSuspendedAlert(
    utilisateurId: number,
    context: AlertContext,
  ): Promise<number | null> {
    return this.createAlert({
      utilisateurId,
      typeCode: AlertType.SUBSCRIPTION_SUSPENDED,
      priority: AlertPriority.CRITIQUE,
      context,
      notes: `Abonnement suspendu après ${context.attemptCount || 3} échecs de paiement`,
    });
  }

  /**
   * Créer une alerte pour erreur webhook
   */
  async createWebhookErrorAlert(
    utilisateurId: number,
    context: AlertContext,
  ): Promise<number | null> {
    return this.createAlert({
      utilisateurId,
      typeCode: AlertType.WEBHOOK_ERROR,
      priority: AlertPriority.HAUTE,
      context,
      notes: `Erreur traitement webhook: ${context.error || "Erreur inconnue"}`,
    });
  }

  /**
   * Résoudre une alerte
   */
  async resolveAlert(
    alerteId: number,
    resoluPar: number,
    notes?: string,
  ): Promise<boolean> {
    try {
      await prisma.alertes_utilisateurs.update({
        where: { id: alerteId },
        data: {
          statut: "resolue",
          date_resolution: new Date(),
          resolu_par: resoluPar,
          notes: notes || undefined,
        },
      });

      console.log("✅ [AlertService] Alerte résolue:", alerteId);
      return true;
    } catch (error: any) {
      console.error(
        "❌ [AlertService] Erreur résolution alerte:",
        error.message,
      );
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Récupérer les alertes actives pour un utilisateur
   */
  async getActiveAlertsByUser(utilisateurId: number) {
    try {
      return await prisma.alertes_utilisateurs.findMany({
        where: {
          utilisateur_id: utilisateurId,
          statut: "active",
        },
        include: {
          alertes_types: true,
        },
        orderBy: {
          date_detection: "desc",
        },
      });
    } catch (error: any) {
      console.error(
        "❌ [AlertService] Erreur récupération alertes:",
        error.message,
      );
      return [];
    }
  }

  /**
   * Récupérer toutes les alertes actives (admin)
   */
  async getAllActiveAlerts(
    limit: number = 50,
    offset: number = 0,
  ): Promise<GetAlertsResult> {
    try {
      const [alertes, total] = await Promise.all([
        prisma.alertes_utilisateurs.findMany({
          where: {
            statut: "active",
          },
          include: {
            alertes_types: true,
            utilisateurs: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
          orderBy: [
            { alertes_types: { priorite: "desc" } },
            { date_detection: "desc" },
          ],
          take: limit,
          skip: offset,
        }),
        prisma.alertes_utilisateurs.count({
          where: {
            statut: "active",
          },
        }),
      ]);

      return {
        alertes,
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      console.error(
        "❌ [AlertService] Erreur récupération alertes actives:",
        error.message,
      );
      return {
        alertes: [],
        total: 0,
        limit,
        offset,
      };
    }
  }

  /**
   * Statistiques des alertes
   */
  async getAlertStats(): Promise<AlertStats> {
    try {
      const [total, active, resolved, byType, byPriority] = await Promise.all([
        prisma.alertes_utilisateurs.count(),
        prisma.alertes_utilisateurs.count({ where: { statut: "active" } }),
        prisma.alertes_utilisateurs.count({ where: { statut: "resolue" } }),
        prisma.alertes_utilisateurs.groupBy({
          by: ["alerte_type_id"],
          where: { statut: "active" },
          _count: true,
        }),
        prisma.alertes_types.findMany({
          where: {
            alertes_utilisateurs: {
              some: { statut: "active" },
            },
          },
          select: {
            priorite: true,
            _count: {
              select: {
                alertes_utilisateurs: {
                  where: { statut: "active" },
                },
              },
            },
          },
        }),
      ]);

      return {
        total,
        active,
        resolved,
        byType: byType.map((t) => ({
          typeId: t.alerte_type_id,
          count: t._count,
        })),
        byPriority: byPriority.reduce(
          (acc, p) => {
            const priority = p.priorite || "normale";
            acc[priority] =
              (acc[priority] || 0) + p._count.alertes_utilisateurs;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };
    } catch (error: any) {
      console.error("❌ [AlertService] Erreur stats alertes:", error.message);
      return {
        total: 0,
        active: 0,
        resolved: 0,
        byType: [],
        byPriority: {},
      };
    }
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const alertService = new AlertService();

export default alertService;
