import { Request, Response } from "express";
import { z } from "zod";
import { creerCommande } from "../services/index.js";
import { createCommandeSchema } from "../validators/index.js";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Handler pour créer une nouvelle commande
 * POST /api/magasin/commandes/creer
 */
export async function createCommande(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("📝 [Handler Commandes] Création d'une nouvelle commande");
    console.log("Corps reçu:", req.body);

    // Validation des données
    const validatedData = createCommandeSchema.parse(req.body);

    console.log(
      "Données validées par le schéma Zod:",
      JSON.stringify(validatedData),
    );

    const result = await creerCommande(
      validatedData,
      magasinClient,
      paiementsClient,
    );

    console.log("✅ [Handler Commandes] Commande créée avec succès:", {
      unique_id: result.unique_id,
      numero_commande: result.numero_commande,
      isDuplicate: result.isDuplicate,
    });

    res.status(201).json({
      message: result.isDuplicate
        ? "Commande existante retournée (doublon évité)"
        : "Commande créée avec succès",
      commande: result,
      isDuplicate: result.isDuplicate,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "❌ [Handler Commandes] Erreur de validation:",
        error.errors,
      );
      res.status(400).json({
        message: "Données de commande invalides",
        errors: error.errors,
      });
      return;
    }

    console.error("❌ [Handler Commandes] Erreur création commande:", error);
    res.status(500).json({
      message: "Erreur lors de la création de la commande",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
