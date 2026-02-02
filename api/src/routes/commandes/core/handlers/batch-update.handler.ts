/**
 * Handler pour mettre à jour le statut de plusieurs commandes en lot
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

interface BatchUpdateItem {
  commandeId: number;
  statut: string;
}

/**
 * Met à jour le statut de plusieurs commandes en lot
 */
export async function batchUpdateStatuts(
  req: Request,
  res: Response,
  prismaClient?: PrismaClient,
): Promise<void> {
  const prisma = prismaClient || defaultPrisma;

  try {
    const { updates } = req.body as { updates: BatchUpdateItem[] };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({
        message: "Le tableau updates est requis et ne peut pas être vide",
      });
      return;
    }

    console.log(`🔄 [API] Batch update de ${updates.length} commandes`);

    const statutsValides = getStatutsValides();

    // Traiter chaque commande individuellement
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        const { commandeId, statut } = update;

        // Validation du statut
        if (!statutsValides.includes(statut)) {
          throw new Error(
            `Statut invalide: ${statut}. Statuts autorisés: ${statutsValides.join(", ")}`,
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
          throw new Error(`Commande ${commandeId} non trouvée`);
        }

        const ancienStatut = commande.statut || "en_attente";

        // Si le statut est le même, pas besoin de mise à jour
        if (ancienStatut === statut) {
          results.push({
            commandeId,
            success: true,
            message: "Statut déjà à jour",
          });
          successCount++;
          continue;
        }

        // Valider la transition de statut
        if (!isValidTransition(ancienStatut, statut)) {
          throw new Error(getTransitionErrorMessage(ancienStatut, statut));
        }

        // Convertir les statuts pour Prisma
        const nouveauStatutEnum = toStatutEnum(statut);
        const ancienStatutEnum = toStatutEnum(ancienStatut);

        // Effectuer la mise à jour dans une transaction
        await prisma.$transaction(async (tx) => {
          // 1. Mettre à jour le statut
          await tx.commandes.update({
            where: { id: commandeId },
            data: { statut: nouveauStatutEnum },
          });

          // 2. Créer une entrée dans l'historique (seulement si le statut change vraiment)
          if (ancienStatutEnum !== nouveauStatutEnum) {
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
              }
            }
          }
        });

        results.push({
          commandeId,
          success: true,
          message: "Statut mis à jour",
        });
        successCount++;
        console.log(
          `✅ [API] Commande ${commandeId} mise à jour: ${ancienStatutEnum} → ${nouveauStatutEnum}`,
        );
      } catch (error: any) {
        results.push({
          commandeId: update.commandeId,
          success: false,
          error: error.message,
        });
        errorCount++;
        console.error(
          `❌ [API] Erreur mise à jour commande ${update.commandeId}:`,
          error,
        );
      }
    }

    console.log(
      `✅ [API] Batch update terminé: ${successCount} succès, ${errorCount} erreurs`,
    );

    res.json({
      success: true,
      message: "Batch update terminé",
      results: {
        successCount,
        errorCount,
        details: results,
      },
    });
  } catch (error: any) {
    console.error("❌ [API] Erreur lors du batch update:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour en lot",
      error: error.message,
    });
  }
}
