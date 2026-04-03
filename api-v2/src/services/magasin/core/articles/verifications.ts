/**
 * Vérifications pour les articles du magasin
 * Gère les vérifications d'existence et de doublons d'articles
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';

/**
 * Vérifie si un article existe par son nom
 */
export async function verifierArticleExiste(
  nom: string
): Promise<{ existe: boolean; articleId?: number; message: string }> {
  if (!nom?.trim()) {
    throw new Error('Le nom de l\'article est requis');
  }

  const article = await prisma.articles.findFirst({
    where: {
      nom: nom.trim(),
    },
    select: {
      id: true,
    },
  });

  if (article) {
    return {
      existe: true,
      articleId: article.id,
      message: 'Article déjà existant.',
    };
  }

  return {
    existe: false,
    message: 'Article disponible.',
  };
}

/**
 * Vérifie si un article existe par son nom ET sa catégorie
 */
export async function verifierArticleExisteParCategorie(
  nom: string,
  categorieId: number
): Promise<{ existe: boolean; articleId?: number; message: string }> {
  if (!nom?.trim()) {
    throw new Error('Le nom de l\'article est requis');
  }

  if (!categorieId || categorieId <= 0) {
    throw new Error('L\'ID de catégorie est invalide');
  }

  const article = await prisma.articles.findFirst({
    where: {
      nom: nom.trim(),
      categorie_id: categorieId,
    },
    select: {
      id: true,
    },
  });

  if (article) {
    return {
      existe: true,
      articleId: article.id,
      message: 'Article déjà existant dans cette catégorie.',
    };
  }

  return {
    existe: false,
    message: 'Article disponible dans cette catégorie.',
  };
}

/**
 * Vérifie si un article peut être créé (pas de doublon)
 * Vérifie à la fois le nom seul et le nom + catégorie
 */
export async function verifierCreationArticlePossible(
  nom: string,
  categorieId?: number
): Promise<{
  possible: boolean;
  raison?: string;
  articleExistant?: { id: number; nom: string; categorieId?: number };
}> {
  if (!nom?.trim()) {
    return {
      possible: false,
      raison: 'Le nom de l\'article est requis',
    };
  }

  // Si une catégorie est spécifiée, vérifier dans cette catégorie
  if (categorieId) {
    const resultatCategorie = await verifierArticleExisteParCategorie(nom, categorieId);

    if (resultatCategorie.existe) {
      const article = await prisma.articles.findFirst({
        where: {
          nom: nom.trim(),
          categorie_id: categorieId,
        },
        select: {
          id: true,
          nom: true,
          categorie_id: true,
        },
      });

      return {
        possible: false,
        raison: resultatCategorie.message,
        articleExistant: article
          ? {
              id: article.id,
              nom: article.nom,
              categorieId: article.categorie_id || undefined,
            }
          : undefined,
      };
    }
  }

  // Vérifier si l'article existe (quel que soit la catégorie)
  const resultatGlobal = await verifierArticleExiste(nom);

  if (resultatGlobal.existe) {
    const article = await prisma.articles.findFirst({
      where: {
        nom: nom.trim(),
      },
      select: {
        id: true,
        nom: true,
        categorie_id: true,
      },
    });

    return {
      possible: false,
      raison: 'Un article avec ce nom existe déjà (possiblement dans une autre catégorie)',
      articleExistant: article
        ? {
            id: article.id,
            nom: article.nom,
            categorieId: article.categorie_id || undefined,
          }
        : undefined,
    };
  }

  return {
    possible: true,
  };
}

/**
 * Vérifie si un article peut être modifié (pas de conflit avec un autre article)
 */
export async function verifierModificationArticlePossible(params: {
  articleId: number;
  nouveauNom?: string;
  nouvelleCategorieId?: number;
}): Promise<{
  possible: boolean;
  raison?: string;
}> {
  const { articleId, nouveauNom, nouvelleCategorieId } = params;

  if (!articleId || articleId <= 0) {
    return {
      possible: false,
      raison: 'ID d\'article invalide',
    };
  }

  // Récupérer l'article actuel
  const articleActuel = await prisma.articles.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      nom: true,
      categorie_id: true,
    },
  });

  if (!articleActuel) {
    return {
      possible: false,
      raison: 'Article non trouvé',
    };
  }

  // Si ni le nom ni la catégorie ne changent, pas de vérification nécessaire
  const nomChange = nouveauNom && nouveauNom.trim() !== articleActuel.nom;
  const categorieChange = nouvelleCategorieId && nouvelleCategorieId !== articleActuel.categorie_id;

  if (!nomChange && !categorieChange) {
    return {
      possible: true,
    };
  }

  // Déterminer le nom et la catégorie à vérifier
  const nomAVerifier = nouveauNom?.trim() || articleActuel.nom;
  const categorieAVerifier = nouvelleCategorieId || articleActuel.categorie_id;

  // Vérifier s'il existe un autre article avec ce nom et cette catégorie
  const articleConflict = await prisma.articles.findFirst({
    where: {
      nom: nomAVerifier,
      categorie_id: categorieAVerifier,
      id: { not: articleId }, // Exclure l'article actuel
    },
  });

  if (articleConflict) {
    return {
      possible: false,
      raison: 'Un autre article existe déjà avec ce nom dans cette catégorie',
    };
  }

  return {
    possible: true,
  };
}
