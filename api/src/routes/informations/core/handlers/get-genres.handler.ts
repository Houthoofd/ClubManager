/**
 * Handler GET /api/informations/genres
 * Récupère la liste de tous les genres (homme/femme)
 */

import { Request, Response } from "express";
import { Informations } from "../../../../db/clients/informations/informations.js";
import { obtenirGenres } from "../services/informations.service.js";

/**
 * Handler pour récupérer tous les genres
 * GET /api/informations/genres
 *
 * @returns 200 - Liste des genres
 * @returns 404 - Aucun genre trouvé
 * @returns 500 - Erreur serveur
 */
export async function getGenres(
  req: Request,
  res: Response,
  informationsClient?: Informations
): Promise<void> {
  try {
    console.log("👤 [Handler Informations] GET /genres - Récupération des genres");

    // Récupérer les genres via le service
    const genres = await obtenirGenres(informationsClient);

    if (!genres || genres.length === 0) {
      console.log("⚠️ [Handler Informations] Aucun genre trouvé");
      res.status(404).json({
        success: false,
        message: "Aucun genre trouvé",
        data: [],
      });
      return;
    }

    console.log(`✅ [Handler Informations] ${genres.length} genres récupérés`);

    res.status(200).json({
      success: true,
      message: "Genres récupérés avec succès",
      data: genres,
      count: genres.length,
    });
  } catch (error) {
    console.error("❌ [Handler Informations] Erreur récupération genres:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des genres",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
