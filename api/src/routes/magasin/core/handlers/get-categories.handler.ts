import { Request, Response } from "express";
import { obtenirLesCategories } from "../services/index.js";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";

/**
 * Handler pour récupérer toutes les catégories
 * GET /api/magasin/articles/categories
 */
export async function getCategories(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
): Promise<void> {
  try {
    console.log("📋 [Handler Catégories] Récupération des catégories");

    const categories = await obtenirLesCategories(magasinClient);

    console.log(
      `✅ [Handler Catégories] ${categories.length} catégories récupérées`,
    );

    res.status(200).json(categories);
  } catch (error) {
    console.error(
      "❌ [Handler Catégories] Erreur récupération catégories:",
      error,
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des catégories",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
