import { Request, Response } from "express";
import { obtenirTousLesProfesseurs } from "../services/index.js";
import { Professeurs } from "../../../../db/clients/professeurs/professeurs.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer tous les professeurs
 * GET /api/professeurs
 */
export async function getProfesseurs(
  req: Request,
  res: Response,
  professeursClient?: Professeurs,
) {
  console.log(
    "📋 [Handler] GET /api/professeurs - Récupération de tous les professeurs",
  );

  try {
    const professeurs = await obtenirTousLesProfesseurs(professeursClient);

    console.log(`✅ [Handler] ${professeurs.length} professeurs récupérés`);

    return res.status(200).json({
      success: true,
      count: professeurs.length,
      data: professeurs,
      message: `${professeurs.length} professeur(s) trouvé(s)`,
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération professeurs:", error);

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des professeurs",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour récupérer un professeur par son ID
 * GET /api/professeurs/:id
 */
export async function getProfesseurById(
  req: Request,
  res: Response,
  professeursClient?: Professeurs,
) {
  const { id } = req.params;

  console.log(
    `📋 [Handler] GET /api/professeurs/${id} - Récupération professeur`,
  );

  try {
    // Validation de l'ID
    const professeurId = parseInt(id);
    if (isNaN(professeurId) || professeurId <= 0) {
      console.log(`⚠️ [Handler] ID professeur invalide: ${id}`);
      throw new ValidationError("ID professeur invalide", [
        {
          field: "id",
          message: "L'ID doit être un nombre positif",
        },
      ]);
    }

    const client = professeursClient || new Professeurs();
    const professeur = await client.obtenirUtilisateurParId(professeurId);

    if (!professeur) {
      console.log(`⚠️ [Handler] Professeur ${professeurId} non trouvé`);
      throw new NotFoundError(`Aucun professeur avec l'ID ${professeurId}`);
    }

    console.log(`✅ [Handler] Professeur ${professeurId} récupéré`);

    return res.status(200).json({
      success: true,
      data: professeur,
      message: "Professeur trouvé",
    });
  } catch (error) {
    console.error(`❌ [Handler] Erreur récupération professeur ${id}:`, error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération du professeur",
      error instanceof Error ? error : undefined,
    );
  }
}
