/**
 * Handler pour récupérer une commande spécifique
 * Utilise Prisma
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";

/**
 * Récupère une commande par son ID avec tous ses détails
 */
export async function getCommande(
  req: Request,
  res: Response,
  prismaClient?: PrismaClient,
): Promise<void> {
  const prisma = prismaClient || defaultPrisma;

  try {
    const commandeId = parseInt(req.params.id);

    console.log(`🔄 [API] Récupération de la commande ${commandeId}...`);

    if (isNaN(commandeId)) {
      res.status(400).json({
        message: "ID de commande invalide",
      });
      return;
    }

    // Récupérer la commande avec toutes ses relations
    const commande = await prisma.commandes.findUnique({
      where: { id: commandeId },
      include: {
        users: {
          select: {
            id: true,
            userId: true,
            nom_utilisateur: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        commande_articles: {
          include: {
            articles: {
              include: {
                categories: true,
                images: true,
              },
            },
            tailles: true,
          },
        },
      },
    });

    if (!commande) {
      res.status(404).json({
        message: "Commande non trouvée",
      });
      return;
    }

    console.log(
      `✅ [API] Commande ${commandeId} récupérée avec ${commande.commande_articles.length} articles`,
    );

    res.json(commande);
  } catch (error: any) {
    console.error(
      "❌ [API] Erreur lors de la récupération de la commande:",
      error,
    );
    res.status(500).json({
      message: "Erreur lors de la récupération de la commande",
      error: error.message,
    });
  }
}
