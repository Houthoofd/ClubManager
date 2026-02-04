import { Request, Response } from "express";
import { z } from "zod";
import { obtenirLesCommandes } from "../services/index.js";
import { getCommandesUtilisateurSchema } from "../validators/index.js";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";

/**
 * Handler pour récupérer toutes les commandes
 * GET /api/magasin/commandes
 */
export async function getCommandes(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
): Promise<void> {
  try {
    console.log("📋 [Handler Commandes] Récupération de toutes les commandes");

    const commandes = await obtenirLesCommandes(magasinClient);

    console.log(
      `✅ [Handler Commandes] ${commandes.length} commandes récupérées`,
    );

    res.status(200).json({ commandes });
  } catch (error) {
    console.error(
      "❌ [Handler Commandes] Erreur récupération commandes:",
      error,
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des commandes",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour récupérer les commandes d'un utilisateur
 * GET /api/magasin/commandes/:userId
 */
export async function getCommandesUtilisateur(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
): Promise<void> {
  try {
    console.log("📋 [Handler Commandes] Récupération commandes utilisateur");

    // Validation des paramètres
    const { userId } = getCommandesUtilisateurSchema.parse(req.params);

    // TODO: Implémenter la méthode dans le service pour filtrer par userId
    const commandes = await obtenirLesCommandes(magasinClient);
    const commandesUtilisateur = commandes.filter(
      (c: any) => c.utilisateur_id === userId,
    );

    console.log(
      `✅ [Handler Commandes] ${commandesUtilisateur.length} commandes trouvées pour l'utilisateur ${userId}`,
    );

    res.status(200).json({ commandes: commandesUtilisateur });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "❌ [Handler Commandes] Erreur de validation:",
        error.errors,
      );
      res.status(400).json({
        message: "Erreur de validation des paramètres",
        errors: error.errors,
      });
      return;
    }

    console.error(
      "❌ [Handler Commandes] Erreur récupération commandes:",
      error,
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des commandes",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
