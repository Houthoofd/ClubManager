/**
 * Handler pour créer une nouvelle commande
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";

interface CreateCommandeArticle {
  article_id: number;
  taille_id: number;
  quantite: number;
  prix: number;
}

interface CreateCommandeBody {
  utilisateur_id: number;
  articles: CreateCommandeArticle[];
}

/**
 * Générer un numéro de commande unique
 */
function generateNumeroCommande(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `CMD-${timestamp}-${random}`;
}

/**
 * Créer une nouvelle commande
 */
export async function createCommande(
  req: Request,
  res: Response,
  prismaClient?: PrismaClient,
): Promise<void> {
  const prisma = prismaClient || defaultPrisma;

  try {
    const { utilisateur_id, articles } = req.body as CreateCommandeBody;

    console.log(
      `🔄 [API] Création d'une commande pour l'utilisateur ${utilisateur_id}`,
    );

    // Validation de base
    if (!utilisateur_id) {
      res.status(400).json({
        message: "L'ID utilisateur est requis",
      });
      return;
    }

    if (!articles || articles.length === 0) {
      res.status(400).json({
        message: "La commande doit contenir au moins un article",
      });
      return;
    }

    // Vérifier que toutes les quantités sont positives
    for (const article of articles) {
      if (article.quantite <= 0) {
        res.status(400).json({
          message: "Les quantités doivent être positives",
        });
        return;
      }
    }

    // Vérifier que l'utilisateur existe
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: utilisateur_id },
    });

    if (!utilisateur) {
      res.status(404).json({
        message: "Utilisateur non trouvé",
      });
      return;
    }

    // Vérifier le stock disponible pour chaque article
    for (const article of articles) {
      const stock = await prisma.articles_tailles.findUnique({
        where: {
          article_id_taille_id: {
            article_id: article.article_id,
            taille_id: article.taille_id,
          },
        },
      });

      if (!stock) {
        res.status(404).json({
          message: `Stock non trouvé pour l'article ${article.article_id} et la taille ${article.taille_id}`,
        });
        return;
      }

      if (stock.stock_disponible < article.quantite) {
        res.status(400).json({
          message: `Stock insuffisant pour l'article ${article.article_id}. Disponible: ${stock.stock_disponible}, Demandé: ${article.quantite}`,
        });
        return;
      }
    }

    // Calculer le total
    const total = articles.reduce(
      (sum, article) => sum + article.prix * article.quantite,
      0,
    );

    // Générer un numéro de commande unique
    const numeroCommande = generateNumeroCommande();

    // Créer la commande avec ses articles dans une transaction
    const commande = await prisma.$transaction(async (tx) => {
      // Créer la commande
      const nouvelleCommande = await tx.commandes.create({
        data: {
          utilisateur_id,
          numero_commande: numeroCommande,
          statut: "en_attente" as any,
          total: total.toFixed(2),
          date_commande: new Date(),
        },
      });

      // Créer les articles de la commande
      for (const article of articles) {
        await tx.commande_articles.create({
          data: {
            commande_id: nouvelleCommande.id,
            article_id: article.article_id,
            taille_id: article.taille_id,
            quantite: article.quantite,
            prix: article.prix,
          },
        });
      }

      return nouvelleCommande;
    });

    console.log(`✅ [API] Commande créée: ${commande.numero_commande}`);

    res.status(201).json({
      id: commande.id,
      numero_commande: commande.numero_commande,
      statut: commande.statut,
      total: commande.total.toString(),
      date_commande: commande.date_commande,
    });
  } catch (error: any) {
    console.error("❌ [API] Erreur lors de la création de la commande:", error);
    res.status(500).json({
      message: "Erreur lors de la création de la commande",
      error: error.message,
    });
  }
}
