/**
 * Handlers REST pour le module Alertes
 * ✅ MIGRÉ : Utilise les services partagés et erreurs standardisées
 * Pattern: Handlers REST légers qui appellent les services
 */

import { Request, Response } from "express";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

// Services partagés (utilisés aussi par GraphQL)
import {
  obtenirDashboardAlertes,
  obtenirAlertesActives,
  obtenirAlertesUtilisateur,
  detecterAlertes,
  resoudreAlerte,
  ignorerAlerte,
} from "../services/alertes.service.js";

/**
 * ✅ Récupère le dashboard des alertes
 * GET /api/alertes/dashboard
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    console.log("📊 [Handler REST] GET /alertes/dashboard");
    const dashboard = await obtenirDashboardAlertes();

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    // Les erreurs sont déjà standardisées par le service
    throw error;
  }
}

/**
 * ✅ Récupère toutes les alertes actives
 * GET /api/alertes/actives
 */
export async function getAlertesActives(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    console.log("📋 [Handler REST] GET /alertes/actives");
    const alertes = await obtenirAlertesActives();

    res.json({
      success: true,
      data: alertes,
    });
  } catch (error: any) {
    throw error;
  }
}

/**
 * ✅ Récupère les alertes d'un utilisateur spécifique
 * GET /api/alertes/utilisateur/:userId
 */
export async function getAlertesUtilisateur(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { userId } = req.params;
    console.log("👤 [Handler REST] GET /alertes/utilisateur/:userId", {
      userId,
    });

    if (!userId || isNaN(parseInt(userId))) {
      throw new ValidationError("ID utilisateur invalide", [
        {
          field: "userId",
          message: "L'ID utilisateur doit être un nombre valide",
        },
      ]);
    }

    const alertes = await obtenirAlertesUtilisateur(parseInt(userId));

    res.json({
      success: true,
      data: alertes,
    });
  } catch (error: any) {
    throw error;
  }
}

/**
 * ✅ Déclenche manuellement la détection des alertes
 * POST /api/alertes/detecter
 */
export async function detecterAlertesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    console.log("🔍 [Handler REST] POST /alertes/detecter");
    const result = await detecterAlertes();

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    throw error;
  }
}

/**
 * ✅ Résout une alerte
 * PUT /api/alertes/:alerteId/resoudre
 */
export async function resoudreAlerteHandler(
  req: any,
  res: Response,
): Promise<void> {
  try {
    const { alerteId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;

    console.log("✅ [Handler REST] PUT /alertes/:alerteId/resoudre", {
      alerteId,
      userId,
      hasNotes: !!notes,
    });

    if (!alerteId || isNaN(parseInt(alerteId))) {
      throw new ValidationError("ID alerte invalide", [
        {
          field: "alerteId",
          message: "L'ID de l'alerte doit être un nombre valide",
        },
      ]);
    }

    const result = await resoudreAlerte(
      parseInt(alerteId),
      notes || "",
      userId,
    );

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    throw error;
  }
}

/**
 * ✅ Ignore une alerte
 * PUT /api/alertes/:alerteId/ignorer
 */
export async function ignorerAlerteHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { alerteId } = req.params;
    const { notes } = req.body;

    console.log("🚫 [Handler REST] PUT /alertes/:alerteId/ignorer", {
      alerteId,
      hasNotes: !!notes,
    });

    if (!alerteId || isNaN(parseInt(alerteId))) {
      throw new ValidationError("ID alerte invalide", [
        {
          field: "alerteId",
          message: "L'ID de l'alerte doit être un nombre valide",
        },
      ]);
    }

    const result = await ignorerAlerte(parseInt(alerteId), notes || "");

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    throw error;
  }
}
