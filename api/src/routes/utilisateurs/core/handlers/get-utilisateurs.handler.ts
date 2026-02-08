/**
 * Handler GET /api/utilisateurs
 * Récupère la liste de tous les utilisateurs
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { obtenirTousLesUtilisateurs } from "../services/utilisateurs.service.js";

/**
 * Handler pour récupérer tous les utilisateurs
 * GET /api/utilisateurs?includeInactive=true
 *
 * Query params:
 * - includeInactive (optionnel): Inclure les utilisateurs inactifs (défaut: false)
 *
 * @returns 200 - Liste des utilisateurs
 * @returns 404 - Aucun utilisateur trouvé
 * @returns 500 - Erreur serveur
 */
export async function getUtilisateurs(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs
): Promise<void> {
  try {
    console.log(
      "👥 [Handler Utilisateurs] GET /utilisateurs - Récupération des utilisateurs"
    );

    const includeInactive = req.query.includeInactive === "true";

    console.log(
      `[Handler Utilisateurs] includeInactive: ${includeInactive}`
    );

    // Récupérer les utilisateurs via le service
    const utilisateurs = await obtenirTousLesUtilisateurs(
      includeInactive,
      utilisateursClient
    );

    if (!utilisateurs || utilisateurs.length === 0) {
      console.log("⚠️ [Handler Utilisateurs] Aucun utilisateur trouvé");
      res.status(404).json({
        message: "Aucun utilisateur trouvé",
        data: [],
      });
      return;
    }

    console.log(
      `✅ [Handler Utilisateurs] ${utilisateurs.length} utilisateur(s) récupéré(s)`
    );

    res.status(200).json({
      message: "Utilisateurs récupérés avec succès",
      data: utilisateurs,
    });
  } catch (error) {
    console.error(
      "❌ [Handler Utilisateurs] Erreur récupération utilisateurs:",
      error
    );

    res.status(500).json({
      message: "Erreur serveur lors de la récupération des utilisateurs",
    });
  }
}
