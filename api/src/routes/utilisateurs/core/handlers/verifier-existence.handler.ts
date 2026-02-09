/**
 * Handler POST /api/utilisateurs/verifier
 * Vérifie l'existence d'un utilisateur par nom, prénom et date de naissance
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { verifierExistenceUtilisateur } from "../services/utilisateurs.service.js";
import { verifierUtilisateurSchema } from "@clubmanager/types/dist/validators.js";

/**
 * Handler pour vérifier l'existence d'un utilisateur
 * POST /api/utilisateurs/verifier
 *
 * Body:
 * {
 *   nom: string,
 *   prenom: string,
 *   date_naissance: string (YYYY-MM-DD)
 * }
 *
 * @returns 200 - Utilisateur n'existe pas (peut s'inscrire)
 * @returns 409 - Utilisateur existe déjà
 * @returns 400 - Données invalides
 * @returns 500 - Erreur serveur
 */
export async function verifierExistence(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs,
): Promise<void> {
  try {
    console.log(
      "🔍 [Handler Utilisateurs] POST /verifier - Vérification existence utilisateur",
    );

    // Vérifier que le body existe
    if (!req.body || typeof req.body !== "object") {
      console.log("⚠️ [Handler Utilisateurs] Body manquant ou invalide");
      res.status(400).json({
        message: "Corps de la requête manquant ou invalide",
        type: "VALIDATION_ERROR",
      });
      return;
    }

    const { nom, prenom, date_naissance } = req.body;

    // Validation des données
    if (!nom || !prenom || !date_naissance) {
      console.log("⚠️ [Handler Utilisateurs] Données manquantes");
      res.status(400).json({
        message: "Nom, prénom et date de naissance sont requis",
        type: "VALIDATION_ERROR",
      });
      return;
    }

    // Validation avec Zod
    const validationResult = verifierUtilisateurSchema.safeParse({
      nom,
      prenom,
      date_naissance,
    });

    if (!validationResult.success) {
      console.log(
        "⚠️ [Handler Utilisateurs] Erreur de validation:",
        validationResult.error.issues,
      );
      res.status(400).json({
        message:
          validationResult.error.issues[0]?.message ||
          "Format de date invalide (YYYY-MM-DD requis)",
        type: "INVALID_DATE_FORMAT",
      });
      return;
    }

    // Appeler le service
    const result = await verifierExistenceUtilisateur(
      nom,
      prenom,
      date_naissance,
      utilisateursClient,
    );

    if (result.exists) {
      console.log("⚠️ [Handler Utilisateurs] Utilisateur existe déjà");
      res.status(409).json({
        message: result.message,
        type: "USER_EXISTS",
        userExists: true,
        userData: result.userData,
      });
    } else {
      console.log("✅ [Handler Utilisateurs] Utilisateur n'existe pas");
      res.status(200).json({
        message: result.message,
        type: "USER_AVAILABLE",
        userExists: false,
        canRegister: true,
      });
    }
  } catch (error: any) {
    console.error(
      "❌ [Handler Utilisateurs] Erreur vérification existence:",
      error,
    );

    res.status(500).json({
      message: "Erreur interne du serveur lors de la vérification",
      type: "SERVER_ERROR",
      error: error.message || "Erreur inconnue",
    });
  }
}
