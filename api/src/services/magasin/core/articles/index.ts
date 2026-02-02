/**
 * Module core - Gestion des articles
 */

export * from "./verifications.js";

import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";
import type {
  Article,
  ArticleCreationData,
  FiltresArticles,
  OptionsPagination,
  OptionsTri,
  IdArticle,
  Stock,
  ArticlesParCategorie,
  MagasinConfirmationResult as ConfirmationResult,
} from "@clubmanager/types";
import {
  MagasinError,
  TAILLES_MAPPING,
  TAILLES_REVERSE_MAPPING,
} from "@clubmanager/types";

/**
 * Récupère tous les articles avec leurs relations
 */
export async function obtenirTousLesArticles(prisma = defaultPrisma) {
  console.log("📋 [MagasinArticles] Récupération de tous les articles");

  try {
    const articles = await prisma.articles.findMany({
      include: {
        images: true,
        stocks: {
          include: {
            tailles: true,
          },
        },
        categories: true,
      },
    });

    const result = articles.map((article: any) => ({
      id: article.id,
      nom: article.nom,
      prix: article.prix,
      description: article.description,
      images: article.images.map((img: any) => img.url),
      stocks: article.stocks.map((stock: any) => ({
        taille: stock.tailles.nom,
        quantite: stock.quantite,
      })),
      categorie: {
        id: article.categories.id,
        nom: article.categories.nom,
      },
    }));

    console.log(`✅ [MagasinArticles] ${result.length} articles récupérés`);
    return result;
  } catch (error: any) {
    console.error("❌ [MagasinArticles] Erreur récupération articles:", error);
    throw error;
  }
}

/**
 * Récupère les articles groupés par catégories
 */
export async function obtenirArticlesParCategories(
  prisma = defaultPrisma,
): Promise<ArticlesParCategorie> {
  console.log("📋 [MagasinArticles] Récupération articles par catégories");

  try {
    const articles = await prisma.articles.findMany({
      include: {
        images: true,
        stocks: {
          include: {
            tailles: true,
          },
        },
        categories: true,
      },
      orderBy: [{ categories: { nom: "asc" } }, { id: "asc" }],
    });

    const mapCategories: ArticlesParCategorie = {};

    articles.forEach((article: any) => {
      const categorieName = article.categories.nom;

      if (!mapCategories[categorieName]) {
        mapCategories[categorieName] = [];
      }

      mapCategories[categorieName].push({
        id: article.id,
        nom: article.nom,
        prix: article.prix,
        description: article.description,
        images: article.images.map((img: any) => img.url),
        stocks: article.stocks.map((stock: any) => ({
          taille: stock.tailles.nom,
          quantite: stock.quantite,
        })),
        categorie_id: article.categories.id,
      });
    });

    console.log(
      `✅ [MagasinArticles] Articles groupés par ${Object.keys(mapCategories).length} catégories`,
    );
    return mapCategories;
  } catch (error: any) {
    console.error(
      "❌ [MagasinArticles] Erreur récupération par catégories:",
      error,
    );
    throw error;
  }
}

/**
 * Crée un nouvel article
 */
export async function creerArticle(
  data: ArticleCreationData,
  prisma = defaultPrisma,
): Promise<ConfirmationResult> {
  console.log("➕ [MagasinArticles] Création article:", data.nom);

  // Validations
  if (!data.nom || data.nom.trim() === "") {
    throw new MagasinError("Le nom de l'article est requis", "INVALID_NAME");
  }

  if (data.prix === undefined || data.prix < 0) {
    throw new MagasinError(
      "Le prix est requis et ne peut pas être négatif",
      "INVALID_PRICE",
    );
  }

  if (!data.categorie_id || data.categorie_id <= 0) {
    throw new MagasinError(
      "L'ID de la catégorie est requis et doit être positif",
      "INVALID_CATEGORY_ID",
    );
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Créer l'article
      const article = await tx.articles.create({
        data: {
          nom: data.nom,
          description: data.description,
          prix: data.prix,
          categorie_id: data.categorie_id,
        },
      });

      // 2. Ajouter les images si présentes
      if (data.images && data.images.length > 0) {
        await tx.images.createMany({
          data: data.images.map((url) => ({
            article_id: article.id,
            url: url,
          })),
        });
      }

      // 3. Ajouter les stocks si présents
      if (data.stocks && data.stocks.length > 0) {
        // Récupérer les IDs des tailles
        const tailles = await tx.tailles.findMany({
          where: {
            nom: {
              in: data.stocks.map((stock) => stock.taille),
            },
          },
        });

        const tailleMap = Object.fromEntries(
          tailles.map((t: any) => [t.nom, t.id]),
        );

        const stockData = data.stocks.map((stock) => {
          const tailleId = tailleMap[stock.taille];
          if (!tailleId) {
            throw new Error(`Taille inconnue: ${stock.taille}`);
          }
          return {
            article_id: article.id,
            taille_id: tailleId,
            quantite: stock.quantite,
          };
        });

        await tx.stocks.createMany({
          data: stockData,
        });
      }

      return article.id;
    });

    console.log(`✅ [MagasinArticles] Article créé avec ID: ${result}`);
    return {
      success: true,
      isConfirm: true,
      message: "Article créé avec succès",
    };
  } catch (error: any) {
    console.error("❌ [MagasinArticles] Erreur création article:", error);
    return {
      success: false,
      isConfirm: false,
      message: `Erreur création article: ${error.message}`,
    };
  }
}

/**
 * Modifie un article existant
 */
export async function modifierArticle(
  id: number,
  data: ArticleCreationData,
  prisma = defaultPrisma,
): Promise<ConfirmationResult> {
  console.log(`✏️ [MagasinArticles] Modification article ${id}`);

  try {
    await prisma.articles.update({
      where: { id },
      data: {
        nom: data.nom,
        description: data.description,
        prix: data.prix,
        categorie_id: data.categorie_id,
      },
    });

    console.log(`✅ [MagasinArticles] Article ${id} modifié`);
    return {
      success: true,
      isConfirm: true,
      message: "Article modifié avec succès",
    };
  } catch (error: any) {
    console.error(
      `❌ [MagasinArticles] Erreur modification article ${id}:`,
      error,
    );
    return {
      success: false,
      isConfirm: false,
      message: `Erreur modification article: ${error.message}`,
    };
  }
}

/**
 * Supprime un article
 */
export async function supprimerArticle(
  articleId: number,
  prisma = defaultPrisma,
): Promise<ConfirmationResult> {
  console.log(`🗑️ [MagasinArticles] Suppression article ${articleId}`);

  try {
    await prisma.articles.delete({
      where: { id: articleId },
    });

    console.log(`✅ [MagasinArticles] Article ${articleId} supprimé`);
    return {
      success: true,
      isConfirm: true,
      message: "Article supprimé avec succès",
    };
  } catch (error: any) {
    console.error(
      `❌ [MagasinArticles] Erreur suppression article ${articleId}:`,
      error,
    );
    return {
      success: false,
      isConfirm: false,
      message: `Erreur suppression article: ${error.message}`,
    };
  }
}
