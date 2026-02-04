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

    if (result.isConfirm) {
      console.log("✅ [Handler Articles] Article modifié avec succès");
      res.status(200).json({
        message: result.message || "Article modifié avec succès",
      });
    } else {
      console.error(
        "❌ [Handler Articles] Échec modification article:",
        result.message,
      );

      // Article non trouvé ou échec de modification
      const messageStr = String(result.message || "");
      const isNotFound =
        messageStr.toLowerCase().includes("non trouvé") ||
        messageStr.toLowerCase().includes("non trouve") ||
        messageStr.toLowerCase().includes("introuvable") ||
        messageStr.toLowerCase().includes("not found");

      res.status(isNotFound ? 404 : 500).json({
        message:
          result.message || "Erreur lors de la modification de l'article",
      });
    }
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
    res.status(500).json({
      message: "Erreur lors de la modification de l'article",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
