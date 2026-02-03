/**
 * Handler GET /api/informations/status
 * Récupère la liste de tous les statuts (actif/inactif)
 */

import { Request, Response } from "express";
import { Informations } from "../../../../db/clients/informations/informations.js";
import { obtenirStatus } from "../services/informations.service.js";

/**
 * Handler pour récupérer tous les statuts
 * GET /api/informations/status
 *
 * @returns 200 - Liste des statuts
 * @returns 404 - Aucun statut trouvé
 * @returns 500 - Erreur serveur
 */
export async function getStatus(
  req: Request,
  res: Response,
  informationsClient?: Informations
): Promise<void> {
  try {
    console.log("📊 [Handler Informations] GET /status - Récupération des statuts");

    // Récupérer les statuts via le service
    const status = await obtenirStatus(informationsClient);

    if (!status || status.length === 0) {
      console.log("⚠️ [Handler Informations] Aucun statut trouvé");
      res.status(404).json({
        success: false,
        message: "Aucun statut trouvé",
        data: [],
      });
      return;
    }

    console.log(`✅ [Handler Informations] ${status.length} statuts récupérés`);

    res.status(200).json({
      success: true,
      message: "Statuts récupérés avec succès",
      data: status,
      count: status.length,
    });
  } catch (error) {
    console.error("❌ [Handler Informations] Erreur récupération statuts:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des statuts",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
