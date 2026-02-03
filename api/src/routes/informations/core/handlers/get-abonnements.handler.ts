/**
 * Handler GET /api/informations/abonnements
 * Récupère la liste de tous les plans tarifaires (abonnements)
 */

import { Request, Response } from "express";
import { Informations } from "../../../../db/clients/informations/informations.js";
import { obtenirAbonnements } from "../services/informations.service.js";

/**
 * Handler pour récupérer tous les plans tarifaires
 * GET /api/informations/abonnements
 *
 * @returns 200 - Liste des plans tarifaires
 * @returns 404 - Aucun plan tarifaire trouvé
 * @returns 500 - Erreur serveur
 */
export async function getAbonnements(
  req: Request,
  res: Response,
  informationsClient?: Informations
): Promise<void> {
  try {
    console.log("💳 [Handler Informations] GET /abonnements - Récupération des plans tarifaires");

    // Récupérer les plans tarifaires via le service
    const abonnements = await obtenirAbonnements(informationsClient);

    if (!abonnements || abonnements.length === 0) {
      console.log("⚠️ [Handler Informations] Aucun plan tarifaire trouvé");
      res.status(404).json({
        success: false,
        message: "Aucun plan tarifaire trouvé",
        data: [],
      });
      return;
    }

    console.log(`✅ [Handler Informations] ${abonnements.length} plans tarifaires récupérés`);

    res.status(200).json({
      success: true,
      message: "Plans tarifaires récupérés avec succès",
      data: abonnements,
      count: abonnements.length,
    });
  } catch (error) {
    console.error("❌ [Handler Informations] Erreur récupération plans tarifaires:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des plans tarifaires",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
