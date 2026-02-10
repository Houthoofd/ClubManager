import { Request, Response } from "express";
import { z } from "zod";
import { modifierArticle } from "../services/index.js";
import { updateArticleSchema } from "@clubmanager/types/validators";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour modifier un article existant
 * PUT /api/magasin/articles/:id
 */
export async function updateArticle(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
): Promise<void> {
  try {
    console.log("📝 [Handler Articles] Modification d'un article");

    // Validation stricte de l'ID avant parseInt
    if (!/^\d+$/.test(req.params.id)) {
      throw new ValidationError("ID invalide");
    }

    const articleId = parseInt(req.params.id, 10);

    if (isNaN(articleId) || articleId <= 0) {
      throw new ValidationError("ID invalide");
    }

    // Validation des données avec l'ID
    const validatedData = updateArticleSchema.parse({
      ...req.body,
      id: articleId,
    });

    console.log(
      "Données validées par le schéma Zod:",
      JSON.stringify(validatedData),
    );

    const result = await modifierArticle(
      articleId,
      validatedData,
      magasinClient,
    );

    console.log("✅ [Handler Articles] Article modifié avec succès");
    res.status(200).json({
      message: result.message || "Article modifié avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "❌ [Handler Articles] Erreur de validation:",
        error.errors,
      );
      throw new ValidationError(
        "Erreur de validation des données",
        formatZodErrors(error.errors),
      );
    }

    console.error("❌ [Handler Articles] Erreur modification article:", error);

    // Vérifier si c'est une erreur métier (article non trouvé)
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

    throw new InternalServerError(
      "Erreur lors de la modification de l'article",
    );
  }
}
