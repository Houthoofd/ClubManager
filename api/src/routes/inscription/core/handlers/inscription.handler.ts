/**
 * Handler pour l'inscription complète d'un utilisateur
 * Gère la validation et l'inscription d'un nouvel utilisateur
 */

import { Request, Response } from "express";
import {
  inscriptionService,
  InscriptionService,
} from "../services/inscription.service.js";
import { inscriptionSchema } from "@clubmanager/types/validators";
import {
  ValidationError,
  ConflictError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

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

      throw new ValidationError(
        parseResult.error.issues[0]?.message || "Données invalides",
        parseResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
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
      console.warn(
        `⚠️ [Handler Inscription] Échec de l'inscription pour: ${inscriptionData.email} - ${result.message}`,
      );

      // Lancer l'erreur appropriée
      if (result.message.includes("existe déjà")) {
        throw new ConflictError(result.message);
      } else {
        throw new ValidationError(result.message);
      }
    }
  } catch (error) {
    console.error(
      "❌ [Handler Inscription] Erreur lors de l'inscription:",
      error,
    );

    // Re-throw si c'est déjà une erreur applicative
    if (error instanceof ValidationError || error instanceof ConflictError) {
      throw error;
    }

    // Sinon, wrapper dans InternalServerError
    throw new InternalServerError(
      "Erreur serveur lors de l'inscription",
      error instanceof Error ? error : undefined,
    );
  }
}
