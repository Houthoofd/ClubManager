/**
 * Handler pour récupérer toutes les commandes
 * Utilise Prisma
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";
import { InternalServerError } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Récupère toutes les commandes avec leurs détails
 */
export async function getCommandes(
  req: Request,
  res: Response,
  prismaClient?: PrismaClient,
): Promise<void> {
  const prisma = prismaClient || defaultPrisma;

  try {
    console.log("🔄 [API] Récupération des commandes...");

    // Filtres optionnels
    const { statut } = req.query;

    // Construire les conditions de filtre
    const where: any = {};
    if (statut) {
      where.statut = statut;
    }

    // Récupérer les commandes avec leurs relations
    const commandes = await prisma.commandes.findMany({
      where,
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
              },
            },
            tailles: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    console.log(`✅ [API] ${commandes.length} commandes récupérées`);

    res.json(commandes);
  } catch (error: any) {
    console.error(
      "❌ [API] Erreur lors de la récupération des commandes:",
      error,
    );
    throw new InternalServerError(
      "Erreur lors de la récupération des commandes",
    );
  }
}
