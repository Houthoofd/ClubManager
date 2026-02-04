/**
 * Handler pour la vérification de l'existence d'un email
 * Vérifie si un email est déjà utilisé dans le système
 */

import { Request, Response } from "express";
import {
  inscriptionService,
  InscriptionService,
} from "../services/inscription.service.js";
import { verificationEmailSchema } from "../validators/inscription.schema.js";

/**
 * POST /api/inscription/verification
 * Vérifie si un email existe déjà dans la base de données
 *
 * Body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "exists": false,
 *   "message": "Email disponible"
 * }
 *
 * Response 409 (si email existe):
 * {
 *   "success": false,
 *   "exists": true,
 *   "message": "Cet email est déjà utilisé"
 * }
 */
export async function verificationEmail(
  req: Request,
  res: Response,
  serviceInstance?: InscriptionService,
): Promise<void> {
  // Utiliser le service injecté ou le service par défaut
  const service = serviceInstance || inscriptionService;

  try {
    // 1. Validation des données avec Zod
    const parseResult = verificationEmailSchema.safeParse(req.body);

    if (!parseResult.success) {
      console.warn(
        "⚠️ [Handler Inscription] Données de vérification invalides:",
        parseResult.error.issues,
      );

      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Email invalide",
        errors: parseResult.error.issues,
      });
      return;
    }

    const { email } = parseResult.data;

    console.log(`🔍 [Handler Inscription] Vérification de l'email: ${email}`);

    // 2. Appel du service
    const result = await service.verifierEmail(email);

    // 3. Retour de la réponse
    if (result.exists) {
      res.status(409).json({
        success: false,
        exists: true,
        message: result.message || "Utilisateur déjà existant",
      });
    } else {
      res.status(200).json({
        success: true,
        exists: false,
        message: result.message || "Email disponible",
      });
    }
  } catch (error) {
    console.error(
      "❌ [Handler Inscription] Erreur lors de la vérification d'email:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification de l'email",
    });
  }
}
