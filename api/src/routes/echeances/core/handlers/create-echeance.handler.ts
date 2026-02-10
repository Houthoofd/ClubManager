import { Request, Response } from "express";
import { z } from "zod";
import { creerEcheance } from "../services/echeances.service.js";
import { createEcheanceSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour créer une nouvelle échéance
 * POST /api/echeances
 *
 * Body:
 * {
 *   utilisateur_id: number,
 *   abonnement_id?: number,
 *   montant: number,
 *   date_echeance: string,
 *   description?: string,
 *   statut?: "en attente" | "payé" | "échu"
 * }
 */
export async function createEcheance(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log(
      `📝 [Handler Échéances] POST / - Création nouvelle échéance`,
      req.body,
    );

    // Validation des données avec Zod
    const validatedData = createEcheanceSchema.parse(req.body);

    console.log("✅ [Handler Échéances] Données validées:", validatedData);

    // Vérification des champs requis
    if (
      !validatedData.utilisateur_id ||
      !validatedData.montant ||
      !validatedData.date_echeance
    ) {
      throw new ValidationError("Données manquantes", [
        { field: "utilisateur_id", message: "Champ requis" },
        { field: "montant", message: "Champ requis" },
        { field: "date_echeance", message: "Champ requis" },
      ]);
    }

    // Créer l'échéance via le service
    const echeanceCreee = await creerEcheance(
      {
        utilisateur_id: validatedData.utilisateur_id,
        abonnement_id: validatedData.abonnement_id ?? undefined,
        montant: validatedData.montant,
        date_echeance: validatedData.date_echeance,
        description: validatedData.description,
        statut: validatedData.statut || "en attente",
      },
      paiementsClient,
    );

    console.log(
      `✅ [Handler Échéances] Échéance ${echeanceCreee.id} créée avec succès`,
    );

    res.status(201).json({
      success: true,
      message: "Échéance créée avec succès",
      data: echeanceCreee,
    });
  } catch (error) {
    console.error("❌ [Handler Échéances] Erreur création échéance:", error);

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Données invalides",
        formatZodErrors(error.errors),
      );
    }

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    // Erreur serveur générique
    throw new InternalServerError(
      "Erreur lors de la création de l'échéance",
      error instanceof Error ? error : undefined,
    );
  }
}
