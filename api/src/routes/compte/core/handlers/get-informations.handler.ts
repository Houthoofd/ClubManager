import { Request, Response } from "express";
import { Compte } from "../../../../db/clients/compte/compte.js";
import { VerifyResultWithData } from "../../../../../../packages/types/dist/index.js";

/**
 * Handler pour obtenir les informations d'un utilisateur
 */
export async function getInformations(
  req: Request,
  res: Response,
  compteClient?: Compte,
): Promise<void> {
  try {
    const { prenom, nom } = req.body;

    // Vérifier si les paramètres nécessaires sont présents
    if (!prenom || !nom) {
      res.status(400).json({
        success: false,
        message: "Les champs 'prenom' et 'nom' sont requis.",
      });
      return;
    }

    const client = compteClient || new Compte();
    const utilisateur: VerifyResultWithData =
      await client.obtenirInformationsUtilisateur(prenom, nom);

    if (utilisateur.isFind && utilisateur.data) {
      // Renvoie toutes les données de l'utilisateur
      res.status(200).json({
        success: true,
        utilisateur: utilisateur.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé.",
        data: [],
      });
    }
  } catch (error) {
    console.error("❌ [Get Informations] Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
