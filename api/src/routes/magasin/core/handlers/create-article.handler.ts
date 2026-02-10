import { Request, Response } from "express";
import { z } from "zod";
import { ajouterArticle } from "../services/index.js";
import { createArticleSchema } from "@clubmanager/types/validators";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";
import {
  ValidationError,
  DatabaseError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

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

    if (!result.isConfirm) {
      console.error(
        "❌ [Handler Articles] Échec création article:",
        result.message,
      );
      throw new DatabaseError(
        result.message || "Erreur lors de la création de l'article",
      );
    }

    console.log("✅ [Handler Articles] Article créé avec succès");
    res.status(201).json({
      message: result.message,
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

    console.error("❌ [Handler Articles] Erreur création article:", error);
    throw new InternalServerError("Erreur lors de la création de l'article");
  }
}
