/**
 * Handler GET /api/utilisateurs/stats
 * Récupère les statistiques des utilisateurs
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { obtenirStatistiques } from "../services/utilisateurs.service.js";

/**
 * Handler pour récupérer les statistiques des utilisateurs
 * GET /api/utilisateurs/stats
 *
 * @returns 200 - Statistiques récupérées avec succès
 * @returns 500 - Erreur serveur
 */
export async function getStats(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs
): Promise<void> {
  try {
    console.log(
      "📊 [Handler Utilisateurs] GET /stats - Récupération des statistiques"
    );

    // Récupérer les statistiques via le service
    const stats = await obtenirStatistiques(utilisateursClient);

    console.log(
      `✅ [Handler Utilisateurs] Statistiques récupérées:`,
      stats
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error(
      "❌ [Handler Utilisateurs] Erreur récupération statistiques:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des statistiques",
      error: error.message || "Erreur inconnue",
    });
  }
}
