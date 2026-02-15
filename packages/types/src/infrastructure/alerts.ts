/**
 * Types et interfaces pour le système d'alertes administrateur
 */

import { z } from "zod";

// ============================================================================
// Enums
// ============================================================================

/**
 * Types d'alertes disponibles
 */
export enum AlertType {
  PAYMENT_FAILURE = "payment_failure",
  SUBSCRIPTION_SUSPENDED = "subscription_suspended",
  WEBHOOK_ERROR = "webhook_error",
  SYSTEM_ERROR = "system_error",
  USER_ISSUE = "user_issue",
}

/**
 * Niveaux de priorité des alertes
 */
export enum AlertPriority {
  BASSE = "basse",
  NORMALE = "normale",
  HAUTE = "haute",
  CRITIQUE = "critique",
}

/**
 * Statuts des alertes
 */
export enum AlertStatus {
  ACTIVE = "active",
  RESOLVED = "resolved",
  IGNORED = "ignored",
}

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Contexte d'une alerte (données additionnelles)
 */
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

/**
 * Input pour créer une alerte
 */
export interface CreateAlertInput {
  utilisateurId: number;
  typeCode: AlertType | string;
  priority?: AlertPriority;
  context?: AlertContext;
  notes?: string;
}

/**
 * Type d'alerte complet
 */
export interface AlerteType {
  id: number;
  code: string;
  nom: string;
  description?: string;
  priorite: AlertPriority;
  actif: boolean;
  created_at: Date;
}

/**
 * Alerte utilisateur complète
 */
export interface AlerteUtilisateur {
  id: number;
  utilisateur_id: number;
  alerte_type_id: number;
  statut: AlertStatus;
  donnees_contexte?: AlertContext;
  date_detection: Date;
  date_resolution?: Date;
  resolu_par?: number;
  notes?: string;
  alertes_types?: AlerteType;
  utilisateurs?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Statistiques des alertes
 */
export interface AlertStats {
  total: number;
  active: number;
  resolved: number;
  ignored: number;
  byType: Array<{
    typeId: number;
    typeCode?: string;
    typeName?: string;
    count: number;
  }>;
  byPriority: Record<AlertPriority, number>;
  recentAlerts?: AlerteUtilisateur[];
}

/**
 * Résultat de récupération des alertes
 */
export interface GetAlertsResult {
  alertes: AlerteUtilisateur[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Action sur une alerte
 */
export interface AlertAction {
  id: number;
  alerte_id: number;
  action_prise: string;
  date_action: Date;
  utilisateur_id: number;
  resultat?: string;
  notes?: string;
}

// ============================================================================
// Validators Zod
// ============================================================================

/**
 * Schéma de validation pour créer une alerte
 */
export const createAlertSchema = z.object({
  utilisateurId: z.number().int().positive(),
  typeCode: z.string().min(1).max(50),
  priority: z.nativeEnum(AlertPriority).optional(),
  context: z.record(z.any()).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Schéma de validation pour résoudre une alerte
 */
export const resolveAlertSchema = z.object({
  alerteId: z.number().int().positive(),
  resoluPar: z.number().int().positive(),
  notes: z.string().max(1000).optional(),
});

/**
 * Schéma de validation pour récupérer les alertes
 */
export const getAlertsSchema = z.object({
  utilisateurId: z.number().int().positive().optional(),
  status: z.nativeEnum(AlertStatus).optional(),
  priority: z.nativeEnum(AlertPriority).optional(),
  typeCode: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * Schéma pour créer une action sur une alerte
 */
export const createAlertActionSchema = z.object({
  alerteId: z.number().int().positive(),
  actionPrise: z.string().min(1).max(500),
  utilisateurId: z.number().int().positive(),
  resultat: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Vérifier si une valeur est un type d'alerte valide
 */
export function isAlertType(value: any): value is AlertType {
  return Object.values(AlertType).includes(value);
}

/**
 * Vérifier si une valeur est une priorité valide
 */
export function isAlertPriority(value: any): value is AlertPriority {
  return Object.values(AlertPriority).includes(value);
}

/**
 * Vérifier si une valeur est un statut valide
 */
export function isAlertStatus(value: any): value is AlertStatus {
  return Object.values(AlertStatus).includes(value);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Obtenir le nom lisible d'un type d'alerte
 */
export function getAlertTypeName(code: AlertType | string): string {
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
 * Obtenir la description d'un type d'alerte
 */
export function getAlertTypeDescription(code: AlertType | string): string {
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

/**
 * Obtenir la couleur associée à une priorité (pour UI)
 */
export function getAlertPriorityColor(priority: AlertPriority): string {
  const colors: Record<AlertPriority, string> = {
    [AlertPriority.BASSE]: "#28a745", // vert
    [AlertPriority.NORMALE]: "#17a2b8", // bleu
    [AlertPriority.HAUTE]: "#fd7e14", // orange
    [AlertPriority.CRITIQUE]: "#dc3545", // rouge
  };
  return colors[priority] || "#6c757d";
}

/**
 * Obtenir l'icône associée à un type d'alerte (pour UI)
 */
export function getAlertTypeIcon(code: AlertType | string): string {
  const icons: Record<string, string> = {
    [AlertType.PAYMENT_FAILURE]: "💳",
    [AlertType.SUBSCRIPTION_SUSPENDED]: "⏸️",
    [AlertType.WEBHOOK_ERROR]: "🔗",
    [AlertType.SYSTEM_ERROR]: "⚠️",
    [AlertType.USER_ISSUE]: "👤",
  };
  return icons[code] || "🔔";
}

// ============================================================================
// Exports
// ============================================================================

export type {
  CreateAlertInput as CreateAlert,
  AlerteUtilisateur as UserAlert,
  GetAlertsResult as AlertsResult,
};
