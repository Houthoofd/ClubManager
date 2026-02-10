import { Request, Response } from "express";
import { z } from "zod";
import { supprimerArticle } from "../services/index.js";
import { deleteArticleSchema } from "@clubmanager/types/validators";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

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
      throw new ValidationError(
        "Erreur de validation des paramètres",
        formatZodErrors(error.errors),
      );
    }

    console.error("❌ [Handler Articles] Erreur suppression article:", error);

    // Déterminer le type d'erreur approprié
    if (error instanceof Error) {
      const messageStr = error.message.toLowerCase();
      const isNotFound =
        messageStr.includes("non trouvé") ||
        messageStr.includes("non trouve") ||
        messageStr.includes("introuvable") ||
        messageStr.includes("not found");

      if (isNotFound) {
        throw new NotFoundError("Article non trouvé");
      }
    }

    throw new InternalServerError("Erreur lors de la suppression de l'article");
  }
}
