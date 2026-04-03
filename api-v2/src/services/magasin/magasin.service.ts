/**
 * Service Magasin - Orchestrateur principal
 * Gestion complète du magasin e-commerce
 */

import type {
  Article,
  ArticleCreationData,
  ArticlesParCategorie,
  MagasinCommande as Commande,
  CommandeDetails,
  NouvelleCommande,
  MagasinCategorie as Categorie,
  Stock,
  FiltresArticles,
  OptionsPagination,
  OptionsTri,
  MagasinConfirmationResult as ConfirmationResult,
  MagasinResponse,
  ArticlesResponse,
  CommandeResponse,
  CommandesResponse,
  CategoriesResponse,
  IdArticle,
  IdCommande,
  IdCategorie,
} from "@clubmanager/types";
import { MagasinError, StatutCommande } from "@clubmanager/types";

// Import depuis les modules core
import * as articlesCore from "./core/articles/index.js";
import * as commandesCore from "./core/commandes/index.js";
import * as stocksCore from "./core/stocks/index.js";
import * as categoriesCore from "./core/categories/index.js";

/**
 * Service principal du magasin
 * Délègue les opérations aux modules spécialisés
 */
export class MagasinService {
  // === ARTICLES ===

  /**
   * Récupère tous les articles avec leurs informations complètes
   */
  async obtenirTousLesArticles(): Promise<ArticlesResponse> {
    try {
      const articles = await articlesCore.obtenirTousLesArticles();
      return {
        success: true,
        data: {
          articles,
          total: articles.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des articles",
        errors: [error.code || "UNKNOWN_ERROR"],
      };
    }
  }

  /**
   * Récupère les articles groupés par catégories
   */
  async obtenirArticlesParCategories(): Promise<
    MagasinResponse<ArticlesParCategorie>
  > {
    try {
      const articlesParCategorie =
        await articlesCore.obtenirArticlesParCategories();
      return {
        success: true,
        data: articlesParCategorie,
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.message ||
          "Erreur lors de la récupération des articles par catégorie",
        errors: [error.code || "UNKNOWN_ERROR"],
      };
    }
  }

  /**
   * Crée un nouvel article
   */
  async creerArticle(data: ArticleCreationData): Promise<ConfirmationResult> {
    try {
      // Validation des données
      if (!data.nom?.trim()) {
        throw new MagasinError(
          "Le nom de l'article est obligatoire",
          "INVALID_ARTICLE_NAME",
        );
      }

      if (!data.prix || data.prix <= 0) {
        throw new MagasinError(
          "Le prix doit être positif",
          "INVALID_ARTICLE_PRICE",
        );
      }

      if (!data.categorie_id) {
        throw new MagasinError(
          "La catégorie est obligatoire",
          "MISSING_CATEGORY",
        );
      }

      return await articlesCore.creerArticle(data);
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la création de l'article",
        "ARTICLE_CREATION_ERROR",
        error,
      );
    }
  }

  // === COMMANDES ===

  /**
   * Récupère toutes les commandes avec détails
   */
  async obtenirToutesLesCommandes(): Promise<CommandesResponse> {
    try {
      const commandes = await commandesCore.obtenirToutesLesCommandes();
      return {
        success: true,
        data: {
          commandes,
          total: commandes.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.message || "Erreur lors de la récupération des commandes",
        errors: [error.code || "UNKNOWN_ERROR"],
      };
    }
  }

  /**
   * Récupère les commandes d'un utilisateur spécifique
   */
  async obtenirCommandesUtilisateur(
    utilisateurId: number,
  ): Promise<CommandesResponse> {
    try {
      if (!utilisateurId || utilisateurId <= 0) {
        throw new MagasinError("ID utilisateur invalide", "INVALID_USER_ID");
      }

      const commandes =
        await commandesCore.obtenirCommandesUtilisateur(utilisateurId);
      return {
        success: true,
        data: {
          commandes,
          total: commandes.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.message ||
          "Erreur lors de la récupération des commandes utilisateur",
        errors: [error.code || "UNKNOWN_ERROR"],
      };
    }
  }

  /**
   * Crée une nouvelle commande
   */
  async ajouterCommande(data: NouvelleCommande): Promise<CommandeResponse> {
    try {
      // Validation des données
      if (!data.utilisateur_id || data.utilisateur_id <= 0) {
        throw new MagasinError("ID utilisateur invalide", "INVALID_USER_ID");
      }

      if (!data.articles || data.articles.length === 0) {
        throw new MagasinError(
          "La commande doit contenir au moins un article",
          "EMPTY_CART",
        );
      }

      // Valider chaque article
      for (const article of data.articles) {
        if (!article.article_id || article.article_id <= 0) {
          throw new MagasinError("ID article invalide", "INVALID_ARTICLE_ID");
        }
        if (!article.quantite || article.quantite <= 0) {
          throw new MagasinError(
            "La quantité doit être positive",
            "INVALID_QUANTITY",
          );
        }
        if (!article.prix || article.prix < 0) {
          throw new MagasinError(
            "Le prix doit être positif ou nul",
            "INVALID_PRICE",
          );
        }
      }

      const result = await commandesCore.ajouterCommande(data);

      // Si la commande est créée avec succès, récupérer les détails
      if (result.success && result.data?.commande_id) {
        const commandeDetails = await commandesCore.obtenirCommandeParId(
          result.data.commande_id,
        );
        return {
          success: true,
          data: {
            commande: commandeDetails as Commande,
          },
          message: result.message,
        };
      }

      return {
        success: result.success,
        message: result.message,
        errors: result.success ? undefined : ["COMMANDE_CREATION_FAILED"],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Erreur lors de la création de la commande",
        errors: [error.code || "UNKNOWN_ERROR"],
      };
    }
  }

  /**
   * Met à jour le statut d'une commande
   */
  async modifierStatutCommande(
    commandeId: number,
    nouveauStatut: StatutCommande,
  ): Promise<ConfirmationResult> {
    try {
      if (!commandeId || commandeId <= 0) {
        throw new MagasinError("ID commande invalide", "INVALID_COMMANDE_ID");
      }

      if (!Object.values(StatutCommande).includes(nouveauStatut)) {
        throw new MagasinError("Statut de commande invalide", "INVALID_STATUS");
      }

      return await commandesCore.modifierStatutCommande(
        commandeId,
        nouveauStatut,
      );
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la modification du statut",
        "STATUS_UPDATE_ERROR",
        error,
      );
    }
  }

  /**
   * Annule une commande
   */
  async annulerCommande(commandeId: number): Promise<ConfirmationResult> {
    try {
      if (!commandeId || commandeId <= 0) {
        throw new MagasinError("ID commande invalide", "INVALID_COMMANDE_ID");
      }

      return await commandesCore.annulerCommande(commandeId);
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de l'annulation de la commande",
        "CANCELLATION_ERROR",
        error,
      );
    }
  }

  // === STOCKS ===

  /**
   * Récupère les stocks d'un article
   */
  async obtenirStocksArticle(
    articleId: number,
  ): Promise<MagasinResponse<Stock[]>> {
    try {
      if (!articleId || articleId <= 0) {
        throw new MagasinError("ID article invalide", "INVALID_ARTICLE_ID");
      }

      const stocks = await stocksCore.obtenirStocksArticle(articleId);
      return {
        success: true,
        data: stocks,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des stocks",
        errors: [error.code || "UNKNOWN_ERROR"],
      };
    }
  }

  /**
   * Met à jour le stock d'un article
   */
  async mettreAJourStock(
    articleId: number,
    taille: string,
    quantite: number,
  ): Promise<ConfirmationResult> {
    try {
      if (!articleId || articleId <= 0) {
        throw new MagasinError("ID article invalide", "INVALID_ARTICLE_ID");
      }

      if (!taille?.trim()) {
        throw new MagasinError("Taille invalide", "INVALID_SIZE");
      }

      if (quantite < 0) {
        throw new MagasinError(
          "La quantité ne peut pas être négative",
          "INVALID_QUANTITY",
        );
      }

      return await stocksCore.mettreAJourStock(articleId, taille, quantite);
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la mise à jour du stock",
        "STOCK_UPDATE_ERROR",
        error,
      );
    }
  }

  /**
   * Vérifie la disponibilité d'un article
   */
  async verifierDisponibilite(
    articleId: number,
    taille: string,
    quantite: number,
  ) {
    try {
      if (!articleId || articleId <= 0) {
        throw new MagasinError("ID article invalide", "INVALID_ARTICLE_ID");
      }

      if (!taille?.trim()) {
        throw new MagasinError("Taille invalide", "INVALID_SIZE");
      }

      if (!quantite || quantite <= 0) {
        throw new MagasinError("Quantité invalide", "INVALID_QUANTITY");
      }

      return await stocksCore.verifierDisponibilite(
        articleId,
        taille,
        quantite,
      );
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la vérification de disponibilité",
        "AVAILABILITY_CHECK_ERROR",
        error,
      );
    }
  }

  // === CATÉGORIES ===

  /**
   * Récupère toutes les catégories
   */
  async obtenirToutesLesCategories(): Promise<CategoriesResponse> {
    try {
      const categories = await categoriesCore.obtenirToutesLesCategories();
      return {
        success: true,
        data: {
          categories,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.message || "Erreur lors de la récupération des catégories",
        errors: [error.code || "UNKNOWN_ERROR"],
      };
    }
  }

  /**
   * Crée une nouvelle catégorie
   */
  async creerCategorie(nom: string): Promise<ConfirmationResult> {
    try {
      if (!nom?.trim()) {
        throw new MagasinError(
          "Le nom de la catégorie est obligatoire",
          "INVALID_CATEGORY_NAME",
        );
      }

      return await categoriesCore.creerCategorie(nom.trim());
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la création de la catégorie",
        "CATEGORY_CREATION_ERROR",
        error,
      );
    }
  }

  /**
   * Modifie une catégorie
   */
  async modifierCategorie(
    categorieId: number,
    nouveauNom: string,
  ): Promise<ConfirmationResult> {
    try {
      if (!categorieId || categorieId <= 0) {
        throw new MagasinError("ID catégorie invalide", "INVALID_CATEGORY_ID");
      }

      if (!nouveauNom?.trim()) {
        throw new MagasinError(
          "Le nom de la catégorie est obligatoire",
          "INVALID_CATEGORY_NAME",
        );
      }

      return await categoriesCore.modifierCategorie(
        categorieId,
        nouveauNom.trim(),
      );
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la modification de la catégorie",
        "CATEGORY_UPDATE_ERROR",
        error,
      );
    }
  }

  /**
   * Supprime une catégorie
   */
  async supprimerCategorie(categorieId: number): Promise<ConfirmationResult> {
    try {
      if (!categorieId || categorieId <= 0) {
        throw new MagasinError("ID catégorie invalide", "INVALID_CATEGORY_ID");
      }

      return await categoriesCore.supprimerCategorie(categorieId);
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la suppression de la catégorie",
        "CATEGORY_DELETE_ERROR",
        error,
      );
    }
  }

  // === STATISTIQUES ET UTILITAIRES ===

  /**
   * Récupère les articles en rupture de stock
   */
  async obtenirArticlesRuptureStock(seuilMinimum: number = 0) {
    try {
      if (seuilMinimum < 0) {
        throw new MagasinError(
          "Le seuil minimum ne peut pas être négatif",
          "INVALID_THRESHOLD",
        );
      }

      return await stocksCore.obtenirArticlesRuptureStock(seuilMinimum);
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la recherche des ruptures de stock",
        "STOCK_SHORTAGE_ERROR",
        error,
      );
    }
  }

  /**
   * Récupère les catégories avec leurs compteurs d'articles
   */
  async obtenirCategoriesAvecCompteurs() {
    try {
      return await categoriesCore.obtenirCategoriesAvecCompteurs();
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la récupération des catégories avec compteurs",
        "CATEGORIES_COUNTS_ERROR",
        error,
      );
    }
  }

  /**
   * Récupère les articles d'une catégorie spécifique
   */
  async obtenirArticlesParCategorie(categorieId: number) {
    try {
      if (!categorieId || categorieId <= 0) {
        throw new MagasinError("ID catégorie invalide", "INVALID_CATEGORY_ID");
      }

      return await categoriesCore.obtenirArticlesParCategorie(categorieId);
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la récupération des articles de la catégorie",
        "CATEGORY_ARTICLES_ERROR",
        error,
      );
    }
  }

  // === VÉRIFICATIONS ===

  /**
   * Vérifie si un article existe par son nom
   */
  async verifierArticleExiste(
    nom: string,
  ): Promise<{ existe: boolean; articleId?: number; message: string }> {
    try {
      return await articlesCore.verifierArticleExiste(nom);
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la vérification de l'article",
        "ARTICLE_CHECK_ERROR",
        error,
      );
    }
  }

  /**
   * Vérifie si un article existe par son nom ET sa catégorie
   */
  async verifierArticleExisteParCategorie(
    nom: string,
    categorieId: number,
  ): Promise<{ existe: boolean; articleId?: number; message: string }> {
    try {
      return await articlesCore.verifierArticleExisteParCategorie(
        nom,
        categorieId,
      );
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la vérification de l'article par catégorie",
        "ARTICLE_CATEGORY_CHECK_ERROR",
        error,
      );
    }
  }

  /**
   * Vérifie si un article peut être créé (pas de doublon)
   */
  async verifierCreationArticlePossible(
    nom: string,
    categorieId?: number,
  ): Promise<{
    possible: boolean;
    raison?: string;
    articleExistant?: { id: number; nom: string; categorieId?: number };
  }> {
    try {
      return await articlesCore.verifierCreationArticlePossible(
        nom,
        categorieId,
      );
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la vérification de création d'article",
        "ARTICLE_CREATION_CHECK_ERROR",
        error,
      );
    }
  }

  /**
   * Vérifie si un article peut être modifié (pas de conflit)
   */
  async verifierModificationArticlePossible(params: {
    articleId: number;
    nouveauNom?: string;
    nouvelleCategorieId?: number;
  }): Promise<{
    possible: boolean;
    raison?: string;
  }> {
    try {
      return await articlesCore.verifierModificationArticlePossible(params);
    } catch (error: any) {
      if (error instanceof MagasinError) {
        throw error;
      }
      throw new MagasinError(
        "Erreur lors de la vérification de modification d'article",
        "ARTICLE_MODIFICATION_CHECK_ERROR",
        error,
      );
    }
  }
}
