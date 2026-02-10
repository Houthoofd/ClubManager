import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import { z } from "zod";
import {
  DataReservation,
  datareservationSchema,
  DataInscription,
  BookResult,
} from "@clubmanager/types";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour inscrire un utilisateur à un cours
 */
export async function inscrireUtilisateur(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    // Validation avec Zod - lance automatiquement ZodError si invalide
    const parsedData = datareservationSchema.parse(req.body);

    const validatedData: DataReservation = {
      utilisateur_nom: parsedData.utilisateur_nom,
      utilisateur_prenom: parsedData.utilisateur_prenom,
      cours_id: parsedData.cours_id,
    };

    console.log("Données validées :", validatedData);

    const client = coursClient || new Cours();

    // Vérification si l'utilisateur est déjà inscrit
    const verifInscriptionUtilisateur: BookResult =
      await client.verifierInscriptionUtilisateur(validatedData);
    console.log(
      "Résultat de la vérification de l'utilisateur :",
      verifInscriptionUtilisateur,
    );

    if (verifInscriptionUtilisateur.isBooked === false) {
      // Vérification si l'utilisateur existe
      if (
        !verifInscriptionUtilisateur.isFind ||
        !verifInscriptionUtilisateur.data
      ) {
        throw new NotFoundError("Utilisateur introuvable");
      }

      // Si l'utilisateur n'est pas encore inscrit, on procède à l'inscription
      const dataToSend: DataInscription = {
        cours_id: validatedData.cours_id,
        utilisateur_id: verifInscriptionUtilisateur.data.userId,
        status_id: 1,
      };

      console.log("Objet dataToSend :", dataToSend);

      // Inscription de l'utilisateur au cours
      const result = await client.inscrireUtilisateurAuCours(dataToSend);
      console.log("Résultat de l'inscription :", result);

      if (result.isConfirm === true) {
        res.status(201).json({
          success: true,
          message: "Utilisateur inscrit avec succès.",
          userId: verifInscriptionUtilisateur.data,
          coursId: validatedData.cours_id,
        });
      } else if (result.message?.includes("complet")) {
        // Cours complet
        throw new ValidationError("Le cours est complet", [
          {
            field: "cours_id",
            message: "Le cours est complet",
          },
        ]);
      } else {
        throw new InternalServerError(
          "Erreur lors de l'inscription de l'utilisateur au cours",
        );
      }
    } else {
      throw new ConflictError("Utilisateur déjà inscrit au cours");
    }
  } catch (error) {
    console.error("❌ [Inscrire Utilisateur] Erreur:", error);

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Données invalides",
        formatZodErrors(error.errors),
      );
    }

    // Re-throw les erreurs GraphQL
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof InternalServerError
    ) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de l'inscription de l'utilisateur",
      error instanceof Error ? error : undefined,
    );
  }
}
