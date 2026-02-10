import { Request, Response } from "express";
import { z } from "zod";
import {
  obtenirArticlesParCategories,
  obtenirLesCategories,
} from "../services/index.js";
import {
  getArticlesSchema,
  getArticleByIdSchema,
} from "@clubmanager/types/validators";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer tous les articles par catégories
 * GET /api/magasin/articles
 */
export async function getArticles(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
): Promise<void> {
  try {
    console.log(
      "📋 [Handler Articles] Récupération des articles par catégories",
    );

    // Validation optionnelle du query param
    const validatedQuery = getArticlesSchema.parse(req.query);

    const articles = await obtenirArticlesParCategories(magasinClient);

    console.log("✅ [Handler Articles] Articles récupérés avec succès");

    res.status(200).json(articles);
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

    console.error("❌ [Handler Articles] Erreur récupération articles:", error);
    throw new InternalServerError(
      "Erreur lors de la récupération des articles",
    );
  }
}

/**
 * Handler pour récupérer un article par son ID
 * GET /api/magasin/articles/:id
 */
export async function getArticleById(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
): Promise<void> {
  try {
    console.log("📋 [Handler Articles] Récupération d'un article par ID");

    // Validation des paramètres
    const { articleId } = getArticleByIdSchema.parse(req.params);

    // Note: Cette fonctionnalité nécessiterait une méthode supplémentaire dans le service
    // Pour l'instant, on retourne tous les articles et on filtre
    const articles = await obtenirArticlesParCategories(magasinClient);

    // Rechercher l'article spécifique (à améliorer avec une requête directe)
    let article = null;
    for (const categorie of articles) {
      if (categorie.articles) {
        article = categorie.articles.find((a: any) => a.id === articleId);
        if (article) break;
      }
    }

    if (!article) {
      console.warn(`⚠️ [Handler Articles] Article ${articleId} non trouvé`);
      throw new NotFoundError("Article non trouvé");
    }

    console.log("✅ [Handler Articles] Article récupéré avec succès");

    res.status(200).json(article);
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

    console.error("❌ [Handler Articles] Erreur récupération article:", error);
    throw new InternalServerError(
      "Erreur lors de la récupération de l'article",
    );
  }
}
