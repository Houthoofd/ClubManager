/**
 * Module core - Gestion des catégories
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { 
  MagasinCategorie as Categorie,
  MagasinConfirmationResult as ConfirmationResult,
  IdCategorie
} from '@clubmanager/types';
import { MagasinError } from '@clubmanager/types';

/**
 * Récupère toutes les catégories
 */
export async function obtenirToutesLesCategories(prisma = defaultPrisma): Promise<Categorie[]> {
  console.log('📋 [MagasinCategories] Récupération de toutes les catégories');
  
  try {
    const categories = await prisma.categories.findMany({
      orderBy: {
        nom: 'asc'
      }
    });

    const result: Categorie[] = categories.map((categorie: any) => ({
      id: categorie.id,
      nom: categorie.nom
    }));

    console.log(`✅ [MagasinCategories] ${result.length} catégories récupérées`);
    return result;
  } catch (error: any) {
    console.error('❌ [MagasinCategories] Erreur récupération catégories:', error);
    throw new MagasinError(
      'Erreur lors de la récupération des catégories',
      'CATEGORIES_FETCH_ERROR',
      error
    );
  }
}

/**
 * Récupère une catégorie par son ID
 */
export async function obtenirCategorieParId(
  categorieId: number,
  prisma = defaultPrisma
): Promise<Categorie | null> {
  console.log(`🔍 [MagasinCategories] Recherche catégorie ${categorieId}`);

  try {
    const categorie = await prisma.categories.findUnique({
      where: { id: categorieId }
    });

    if (!categorie) {
      console.warn(`⚠️ [MagasinCategories] Catégorie ${categorieId} non trouvée`);
      return null;
    }

    const result: Categorie = {
      id: categorie.id,
      nom: categorie.nom
    };

    console.log(`✅ [MagasinCategories] Catégorie ${categorieId} récupérée: ${result.nom}`);
    return result;
  } catch (error: any) {
    console.error(`❌ [MagasinCategories] Erreur récupération catégorie ${categorieId}:`, error);
    throw new MagasinError(
      'Erreur lors de la récupération de la catégorie',
      'CATEGORIE_FETCH_ERROR',
      error
    );
  }
}

/**
 * Crée une nouvelle catégorie
 */
export async function creerCategorie(
  nom: string,
  prisma = defaultPrisma
): Promise<ConfirmationResult> {
  console.log(`➕ [MagasinCategories] Création catégorie: ${nom}`);

  try {
    // Nettoyer le nom en supprimant les espaces
    const nomNettoye = nom.trim();
    
    // Vérifier si la catégorie existe déjà
    const categorieExistante = await prisma.categories.findFirst({
      where: {
        nom: {
          equals: nomNettoye,
          mode: 'insensitive'
        }
      }
    });

    if (categorieExistante) {
      throw new MagasinError(
        `Une catégorie avec le nom "${nomNettoye}" existe déjà`,
        'CATEGORIE_ALREADY_EXISTS',
        { nom: nomNettoye, existingId: categorieExistante.id }
      );
    }

    const categorie = await prisma.categories.create({
      data: { nom: nomNettoye }
    });

    console.log(`✅ [MagasinCategories] Catégorie créée: ${nom} (ID: ${categorie.id})`);
    return {
      success: true,
      isConfirm: true,
      message: 'Catégorie créée avec succès',
      data: {
        id: categorie.id,
        nom: categorie.nom
      }
    };
  } catch (error: any) {
    console.error(`❌ [MagasinCategories] Erreur création catégorie:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de la création de la catégorie',
      'CATEGORIE_CREATION_ERROR',
      error
    );
  }
}

/**
 * Modifie le nom d'une catégorie
 */
export async function modifierCategorie(
  categorieId: number,
  nouveauNom: string,
  prisma = defaultPrisma
): Promise<ConfirmationResult> {
  console.log(`🔄 [MagasinCategories] Modification catégorie ${categorieId} -> ${nouveauNom}`);

  try {
    // Vérifier si la catégorie existe
    const categorie = await prisma.categories.findUnique({
      where: { id: categorieId }
    });

    if (!categorie) {
      throw new MagasinError(
        `Catégorie ${categorieId} non trouvée`,
        'CATEGORIE_NOT_FOUND',
        { categorieId }
      );
    }

    // Vérifier si le nouveau nom est déjà utilisé
    const categorieExistante = await prisma.categories.findFirst({
      where: {
        nom: {
          equals: nouveauNom,
          mode: 'insensitive'
        },
        id: {
          not: categorieId
        }
      }
    });

    if (categorieExistante) {
      throw new MagasinError(
        `Une catégorie avec le nom "${nouveauNom}" existe déjà`,
        'CATEGORIE_NAME_ALREADY_EXISTS',
        { nouveauNom, existingId: categorieExistante.id }
      );
    }

    const categorieModifiee = await prisma.categories.update({
      where: { id: categorieId },
      data: { nom: nouveauNom }
    });

    console.log(`✅ [MagasinCategories] Catégorie ${categorieId} modifiée: ${categorie.nom} -> ${nouveauNom}`);
    return {
      success: true,
      isConfirm: true,
      message: 'Catégorie modifiée avec succès',
      data: {
        id: categorieModifiee.id,
        ancienNom: categorie.nom,
        nouveauNom: categorieModifiee.nom
      }
    };
  } catch (error: any) {
    console.error(`❌ [MagasinCategories] Erreur modification catégorie ${categorieId}:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de la modification de la catégorie',
      'CATEGORIE_UPDATE_ERROR',
      error
    );
  }
}

/**
 * Supprime une catégorie (seulement si elle n'a pas d'articles associés)
 */
export async function supprimerCategorie(
  categorieId: number,
  prisma = defaultPrisma
): Promise<ConfirmationResult> {
  console.log(`🗑️ [MagasinCategories] Suppression catégorie ${categorieId}`);

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // Vérifier si la catégorie existe
      const categorie = await tx.categories.findUnique({
        where: { id: categorieId }
      });

      if (!categorie) {
        throw new MagasinError(
          `Catégorie ${categorieId} non trouvée`,
          'CATEGORIE_NOT_FOUND',
          { categorieId }
        );
      }

      // Vérifier s'il y a des articles associés
      const articlesCount = await tx.articles.count({
        where: { categorie_id: categorieId }
      });

      if (articlesCount > 0) {
        throw new MagasinError(
          `Impossible de supprimer la catégorie "${categorie.nom}": ${articlesCount} article(s) y sont associé(s)`,
          'CATEGORIE_HAS_ARTICLES',
          { categorieId, nom: categorie.nom, articlesCount }
        );
      }

      // Supprimer la catégorie
      await tx.categories.delete({
        where: { id: categorieId }
      });

      return {
        categorieId,
        nom: categorie.nom
      };
    });

    console.log(`✅ [MagasinCategories] Catégorie ${categorieId} supprimée: ${result.nom}`);
    return {
      success: true,
      isConfirm: true,
      message: 'Catégorie supprimée avec succès',
      data: result
    };
  } catch (error: any) {
    console.error(`❌ [MagasinCategories] Erreur suppression catégorie ${categorieId}:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de la suppression de la catégorie',
      'CATEGORIE_DELETE_ERROR',
      error
    );
  }
}

/**
 * Récupère les catégories avec le nombre d'articles de chacune
 */
export async function obtenirCategoriesAvecCompteurs(prisma = defaultPrisma) {
  console.log('📋 [MagasinCategories] Récupération catégories avec compteurs');

  try {
    const categories = await prisma.categories.findMany({
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    const result = categories.map((categorie: any) => ({
      id: categorie.id,
      nom: categorie.nom,
      nombreArticles: categorie._count.articles
    }));

    console.log(`✅ [MagasinCategories] ${result.length} catégories avec compteurs récupérées`);
    return result;
  } catch (error: any) {
    console.error('❌ [MagasinCategories] Erreur récupération catégories avec compteurs:', error);
    throw new MagasinError(
      'Erreur lors de la récupération des catégories avec compteurs',
      'CATEGORIES_WITH_COUNTS_FETCH_ERROR',
      error
    );
  }
}

/**
 * Récupère les articles d'une catégorie spécifique
 */
export async function obtenirArticlesParCategorie(
  categorieId: number,
  prisma = defaultPrisma
) {
  console.log(`📋 [MagasinCategories] Récupération articles catégorie ${categorieId}`);

  try {
    const categorie = await prisma.categories.findUnique({
      where: { id: categorieId },
      include: {
        articles: {
          include: {
            images: true,
            stocks: {
              include: {
                tailles: true
              }
            }
          },
          orderBy: {
            nom: 'asc'
          }
        }
      }
    });

    if (!categorie) {
      throw new MagasinError(
        `Catégorie ${categorieId} non trouvée`,
        'CATEGORIE_NOT_FOUND',
        { categorieId }
      );
    }

    const articles = categorie.articles.map((article: any) => ({
      id: article.id,
      nom: article.nom,
      description: article.description,
      prix: article.prix,
      images: article.images.map((img: any) => img.url),
      stocks: article.stocks.map((stock: any) => ({
        taille: stock.tailles.nom,
        quantite: stock.quantite
      })),
      categorie_id: article.categorie_id
    }));

    console.log(`✅ [MagasinCategories] ${articles.length} articles récupérés pour catégorie ${categorieId}`);
    return {
      categorie: {
        id: categorie.id,
        nom: categorie.nom
      },
      articles
    };
  } catch (error: any) {
    console.error(`❌ [MagasinCategories] Erreur récupération articles catégorie ${categorieId}:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de la récupération des articles de la catégorie',
      'CATEGORIE_ARTICLES_FETCH_ERROR',
      error
    );
  }
}
