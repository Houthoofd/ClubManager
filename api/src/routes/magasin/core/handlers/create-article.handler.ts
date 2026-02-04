import { Request, Response } from "express";
import { z } from "zod";
import { ajouterArticle } from "../services/index.js";
import { createArticleSchema } from "../validators/index.js";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";

/**
 * Handler pour créer un nouvel article
 * POST /api/magasin/articles/ajouter
 */
export async function createArticle(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
): Promise<void> {
  try {
    console.log("📝 [Handler Articles] Création d'un nouvel article");

    // Validation des données
    const validatedData = createArticleSchema.parse(req.body);

    console.log(
      "Données validées par le schéma Zod:",
      JSON.stringify(validatedData),
    );

    const result = await ajouterArticle(validatedData, magasinClient);

    if (result.isConfirm) {
      console.log("✅ [Handler Articles] Article créé avec succès");
      res.status(201).json({
        message: result.message,
      });
    } else {
      console.error(
        "❌ [Handler Articles] Échec création article:",
        result.message,
      );
      res.status(500).json({
        message: result.message || "Erreur lors de la création de l'article",
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

    console.error("❌ [Handler Articles] Erreur création article:", error);
    res.status(500).json({
      message: "Erreur lors de la création de l'article",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
