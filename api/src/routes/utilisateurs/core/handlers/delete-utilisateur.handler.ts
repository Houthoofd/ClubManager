/**
 * Handler DELETE /api/utilisateurs/:id
 * Suppression définitive d'un utilisateur (hard delete)
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { supprimerUtilisateur } from "../services/utilisateurs.service.js";
import { utilisateurIdParamSchema } from "@clubmanager/types/dist/validators.js";

/**
 * Handler pour la suppression définitive d'un utilisateur
 * DELETE /api/utilisateurs/:id
 *
 * Params:
 * - id: ID de l'utilisateur
 *
 * Query params:
 * - isConfirm (optionnel): Confirmation de suppression (boolean)
 *
 * @returns 200 - Utilisateur supprimé avec succès
 * @returns 404 - Utilisateur non trouvé
 * @returns 400 - ID invalide ou confirmation requise
 * @returns 500 - Erreur serveur
 */
export async function deleteUtilisateur(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs,
): Promise<void> {
  try {
    console.log(
      `🗑️ [Handler Utilisateurs] DELETE /utilisateurs/:id - ID: ${req.params.id}`,
    );

    // Validation de l'ID
    const validationResult = utilisateurIdParamSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      console.log(
        "⚠️ [Handler Utilisateurs] ID invalide:",
        validationResult.error.issues,
      );
      res.status(400).json({
        message:
          validationResult.error.issues[0]?.message ||
          "L'ID de l'utilisateur doit être un nombre entier positif",
      });
      return;
    }

    const utilisateurId = validationResult.data.id;

    // Vérifier la confirmation
    const isConfirm = req.query.isConfirm === "true";

    if (!isConfirm) {
      console.log(
        "⚠️ [Handler Utilisateurs] Confirmation de suppression requise",
      );
      res.status(400).json({
        isConfirm: false,
        message:
          "Confirmation requise pour supprimer définitivement l'utilisateur",
      });
      return;
    }

    // Créer le client et vérifier si l'utilisateur existe
    const client = utilisateursClient || new Utilisateurs();
    const utilisateurExiste = await client.obtenirParId(utilisateurId);

    if (!utilisateurExiste) {
      console.log(
        `⚠️ [Handler Utilisateurs] Utilisateur ${utilisateurId} non trouvé`,
      );
      res.status(404).json({
        isConfirm: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }

    // Supprimer l'utilisateur via le service
    const result = await supprimerUtilisateur(utilisateurId, client);

    if (result.success) {
      console.log(
        `✅ [Handler Utilisateurs] Utilisateur ${utilisateurId} supprimé définitivement`,
      );
      res.status(200).json({
        isConfirm: true,
        message: result.message,
        action: "hard_delete",
      });
    } else {
      console.warn(
        `⚠️ [Handler Utilisateurs] Échec suppression utilisateur ${utilisateurId}`,
      );
      res.status(400).json({
        isConfirm: false,
        message: result.message,
      });
    }
  } catch (error: any) {
    console.error(
      "❌ [Handler Utilisateurs] Erreur suppression utilisateur:",
      error,
    );

    res.status(500).json({
      isConfirm: false,
      message: "Erreur serveur lors de la suppression de l'utilisateur",
      error: error.message || "Erreur inconnue",
    });
  }
}
