/**
 * Handler pour l'inscription complète d'un utilisateur
 * Gère la validation et l'inscription d'un nouvel utilisateur
 */

import { Request, Response } from "express";
import {
  inscriptionService,
  InscriptionService,
} from "../services/inscription.service.js";
import { inscriptionSchema } from "../validators/inscription.schema.js";

/**
 * POST /api/inscription/validation
 * Inscrit un nouvel utilisateur dans le système
 *
 * Body:
 * {
 *   "nom": "Dupont",
 *   "prenom": "Jean",
 *   "email": "jean.dupont@example.com",
 *   "password": "SecureP@ss123",
 *   "date": "1990-01-15",
 *   "abonnement": 1,
 *   "genre": 1
 * }
 *
 * Response 201 (succès):
 * {
 *   "success": true,
 *   "message": "Inscription réussie",
 *   "userId": 42
 * }
 *
 * Response 409 (email déjà utilisé):
 * {
 *   "success": false,
 *   "message": "Un compte avec cet email existe déjà"
 * }
 *
 * Response 400 (données invalides):
 * {
 *   "success": false,
 *   "message": "Le mot de passe doit contenir au moins 8 caractères",
 *   "errors": [...]
 * }
 */
export async function inscription(
  req: Request,
  res: Response,
  serviceInstance?: InscriptionService,
): Promise<void> {
  // Utiliser le service injecté ou le service par défaut
  const service = serviceInstance || inscriptionService;

  try {
    // 1. Validation des données avec Zod
    const parseResult = inscriptionSchema.safeParse(req.body);

    if (!parseResult.success) {
      console.warn(
        "⚠️ [Handler Inscription] Données d'inscription invalides:",
        parseResult.error.issues,
      );

      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Données invalides",
        errors: parseResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const inscriptionData = parseResult.data;

    console.log(
      `📝 [Handler Inscription] Tentative d'inscription pour: ${inscriptionData.email}`,
    );

    // 2. Appel du service pour l'inscription
    const result = await service.inscrireUtilisateur(inscriptionData);

    // 3. Retour de la réponse selon le résultat
    if (result.success) {
      console.log(
        `✅ [Handler Inscription] Inscription réussie pour: ${inscriptionData.email}`,
      );

      res.status(201).json({
        success: true,
        message: result.message,
        userId: result.userId,
      });
    } else {
      // Déterminer le code de statut approprié
      const statusCode = result.message.includes("existe déjà") ? 409 : 400;

      console.warn(
        `⚠️ [Handler Inscription] Échec de l'inscription pour: ${inscriptionData.email} - ${result.message}`,
      );

      res.status(statusCode).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error(
      "❌ [Handler Inscription] Erreur lors de l'inscription:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'inscription",
    });
  }
}
