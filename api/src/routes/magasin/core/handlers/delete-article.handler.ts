import { Request, Response } from "express";
import { z } from "zod";
import { supprimerArticle } from "../services/index.js";
import { deleteArticleSchema } from "../validators/index.js";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";

/**
 * Handler pour supprimer un article
 * DELETE /api/magasin/articles/:id
 */
export async function deleteArticle(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
): Promise<void> {
  try {
    console.log("🗑️ [Handler Articles] Suppression d'un article");

    // Validation des paramètres
    const { id } = deleteArticleSchema.parse(req.params);

    const result = await supprimerArticle(id, magasinClient);

    console.log("✅ [Handler Articles] Article supprimé avec succès");

    res.status(200).json({
      message: result.message || "Article supprimé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "❌ [Handler Articles] Erreur de validation:",
        error.errors,
      );
      res.status(400).json({
        message: "Erreur de validation des paramètres",
        errors: error.errors,
      });
      return;
    }

    console.error("❌ [Handler Articles] Erreur suppression article:", error);

    // Déterminer le code de statut approprié
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    const messageStr = String(errorMessage).toLowerCase();

    const isNotFound =
      messageStr.includes("non trouvé") ||
      messageStr.includes("non trouve") ||
      messageStr.includes("introuvable") ||
      messageStr.includes("not found");

    res.status(isNotFound ? 404 : 500).json({
      message: "Erreur lors de la suppression de l'article",
      error: errorMessage,
    });
  }
}
