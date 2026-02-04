import { Request, Response } from "express";
import { z } from "zod";
import { modifierArticle } from "../services/index.js";
import { updateArticleSchema } from "../validators/index.js";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";

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
      res.status(400).json({ message: "ID invalide" });
      return;
    }

    const articleId = parseInt(req.params.id, 10);

    if (isNaN(articleId) || articleId <= 0) {
      res.status(400).json({ message: "ID invalide" });
      return;
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
      res.status(400).json({
        message: "Erreur de validation des données",
        errors: error.errors,
      });
      return;
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
        res.status(404).json({
          message: "Article non trouvé",
        });
        return;
      }
    }

    res.status(500).json({
      message: "Erreur lors de la modification de l'article",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
