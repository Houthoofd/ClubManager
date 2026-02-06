import { Request, Response } from "express";
import { obtenirTousLesProfesseurs } from "../services/index.js";
import { Professeurs } from "../../../../db/clients/professeurs/professeurs.js";

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

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des professeurs",
    });
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
      return res.status(400).json({
        success: false,
        message: "ID professeur invalide",
        error: "L'ID doit être un nombre positif",
      });
    }

    const client = professeursClient || new Professeurs();
    const professeur = await client.obtenirUtilisateurParId(professeurId);

    if (!professeur) {
      console.log(`⚠️ [Handler] Professeur ${professeurId} non trouvé`);
      return res.status(404).json({
        success: false,
        message: "Professeur non trouvé",
        error: `Aucun professeur avec l'ID ${professeurId}`,
      });
    }

    console.log(`✅ [Handler] Professeur ${professeurId} récupéré`);

    return res.status(200).json({
      success: true,
      data: professeur,
      message: "Professeur trouvé",
    });
  } catch (error) {
    console.error(`❌ [Handler] Erreur récupération professeur ${id}:`, error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du professeur",
    });
  }
}
