/**
 * Handler pour mettre à jour le statut d'une commande
 * Utilise Prisma avec support de articles_tailles et historique_statuts_commande
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";
import {
  isValidTransition,
  toStatutEnum,
  getStatutsValides,
  getTransitionErrorMessage,
} from "../utils/statut-validator.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Met à jour le statut d'une commande avec gestion des stocks et historique
 */
export async function updateStatut(
  req: Request,
  res: Response,
  prismaClient?: PrismaClient,
): Promise<void> {
  const prisma = prismaClient || defaultPrisma;

  try {
    const commandeId = parseInt(req.params.id);
    const { statut } = req.body;

    console.log(
      `🔄 [API] Mise à jour statut commande ${commandeId} vers ${statut}`,
    );

    // Validation du statut
    const statutsValides = getStatutsValides();
    if (!statutsValides.includes(statut)) {
      throw new ValidationError(
        "Statut invalide. Statuts autorisés: " + statutsValides.join(", "),
      );
    }

    // Vérifier que la commande existe
    const commande = await prisma.commandes.findUnique({
      where: { id: commandeId },
      include: {
        commande_articles: true,
      },
    });

    if (!commande) {
      throw new NotFoundError("Commande non trouvée");
    }

    const ancienStatut = commande.statut || "en_attente";

    // Si le statut est le même, pas besoin de mise à jour
    if (ancienStatut === statut) {
      res.json({
        success: true,
        message: "Le statut est déjà à jour",
        commandeId,
        statut,
      });
      return;
    }

    // Valider la transition de statut
    if (!isValidTransition(ancienStatut, statut)) {
      throw new ValidationError(
        getTransitionErrorMessage(ancienStatut, statut),
      );
    }

    // Convertir les statuts pour Prisma
    const nouveauStatutEnum = toStatutEnum(statut);
    const ancienStatutEnum = toStatutEnum(ancienStatut);

    // Effectuer toutes les opérations dans une transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le statut de la commande
      await tx.commandes.update({
        where: { id: commandeId },
        data: { statut: nouveauStatutEnum },
      });

      // 2. Créer une entrée dans l'historique (seulement si le statut change vraiment)
      if (ancienStatutEnum && ancienStatutEnum !== nouveauStatutEnum) {
        await tx.historique_statuts_commande.create({
          data: {
            commande_id: commandeId,
            ancien_statut: ancienStatutEnum,
            nouveau_statut: nouveauStatutEnum,
            date_changement: new Date(),
          },
        });
      }

      // 3. Gérer les stocks si nécessaire
      const shouldDecreaseStock =
        nouveauStatutEnum === "exp_di_e" && ancienStatutEnum !== "exp_di_e";
      const shouldIncreaseStock =
        ancienStatutEnum === "exp_di_e" && nouveauStatutEnum !== "exp_di_e";

      if (shouldDecreaseStock || shouldIncreaseStock) {
        for (const article of commande.commande_articles) {
          // Récupérer le stock actuel
          const stock = await tx.articles_tailles.findUnique({
            where: {
              article_id_taille_id: {
                article_id: article.article_id,
                taille_id: article.taille_id,
              },
            },
          });

          if (stock) {
            const quantiteChange = shouldDecreaseStock
              ? -article.quantite
              : article.quantite;
            const nouvelleQuantite = Math.max(
              0,
              stock.stock_disponible + quantiteChange,
            );

            await tx.articles_tailles.update({
              where: {
                article_id_taille_id: {
                  article_id: article.article_id,
                  taille_id: article.taille_id,
                },
              },
              data: {
                stock_disponible: nouvelleQuantite,
              },
            });

            console.log(
              `📦 [API] Stock mis à jour pour article ${article.article_id}, taille ${article.taille_id}: ${stock.stock_disponible} → ${nouvelleQuantite}`,
            );
          }
        }
      }
    });

    console.log(
      `✅ [API] Statut commande ${commandeId} mis à jour: ${ancienStatut} → ${statut}`,
    );

    res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      commandeId,
      ancienStatut,
      nouveauStatut: statut,
    });
  } catch (error: any) {
    console.error("❌ [API] Erreur lors de la mise à jour du statut:", error);
    throw new InternalServerError("Erreur lors de la mise à jour du statut");
  }
}
