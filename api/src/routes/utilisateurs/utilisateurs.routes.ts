/**
 * Routes du module Utilisateurs
 * Gestion des utilisateurs (inscription, connexion, profil, etc.)
 */

import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  verifierExistence,
  getUtilisateurs,
  getUtilisateurById,
  inscription,
  connexionUserId,
  updateUtilisateur,
  deleteUtilisateur,
  getStats,
  healthCheck,
} from "./core/handlers/index.js";
import { emailClient } from "../../clients/emailClient.js";
import { EmailService } from "../../services/emailService.js";

const router = express.Router();
const emailService = new EmailService();

console.log("🔧 [Utilisateurs Routes] Initialisation des routes utilisateurs refactorisées");

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * GET /api/utilisateurs/health
 * Health check du module
 * Utile pour monitoring et diagnostics
 */
router.get("/health", healthCheck);

/**
 * POST /api/utilisateurs/verifier
 * Vérifier l'existence d'un utilisateur par nom, prénom et date de naissance
 *
 * Body:
 * {
 *   nom: string,
 *   prenom: string,
 *   date_naissance: string (YYYY-MM-DD)
 * }
 *
 * Response:
 * {
 *   message: string,
 *   type: "USER_AVAILABLE" | "USER_EXISTS" | "VALIDATION_ERROR",
 *   userExists: boolean,
 *   canRegister?: boolean,
 *   userData?: object
 * }
 */
router.post("/verifier", verifierExistence);

/**
 * POST /api/utilisateurs/inscription
 * Inscription d'un nouvel utilisateur avec envoi d'email de vérification
 *
 * Body:
 * {
 *   prenom: string,
 *   nom: string,
 *   nom_utilisateur?: string (généré automatiquement si absent),
 *   email: string,
 *   password: string,
 *   genre_id: number,
 *   abonnement_id: number,
 *   date_naissance: string (YYYY-MM-DD),
 *   date_inscription?: string (YYYY-MM-DD),
 *   status_id?: number,
 *   grade_id?: number
 * }
 *
 * Response:
 * {
 *   message: string,
 *   generatedUserId: number,
 *   inscriptionDetails: object,
 *   emailStatus: {
 *     sent: boolean,
 *     message?: string,
 *     details?: object
 *   }
 * }
 */
router.post("/inscription", inscription);

/**
 * POST /api/utilisateurs/connexion-userid
 * Connexion d'un utilisateur par userId
 *
 * Body:
 * {
 *   userId: string,
 *   password: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: {
 *     id: number,
 *     prenom: string,
 *     nom: string,
 *     email: string,
 *     token?: string
 *   }
 * }
 */
router.post("/connexion-userid", connexionUserId);

/**
 * POST /api/utilisateurs/connexion
 * Connexion d'un utilisateur par email (legacy)
 *
 * Body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: object
 * }
 */
router.post("/connexion", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis"
      });
    }

    const { Utilisateurs } = await import("../../db/clients/utilisateurs/utilisateurs.js");
    const client = new Utilisateurs();
    const result = await client.validerConnexion({ email, password });

    if (result.isFind) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.dataToStore
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    console.error("❌ [Route Utilisateurs] Erreur connexion email:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion"
    });
  }
});

/**
 * GET /api/utilisateurs/verify-email-token
 * Validation du token d'email via URL (lien dans l'email)
 *
 * Query params:
 * - token: string (token de validation)
 * - userId: string (ID utilisateur)
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: object,
 *   redirect_to: string
 * }
 */
router.get("/verify-email-token", async (req, res) => {
  try {
    const { token, userId } = req.query;

    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        error: "Token et userId requis dans les paramètres de requête",
        redirect_to: "/pages/connexion?error=missing_params"
      });
    }

    console.log("🔍 [Route PUBLIC] Validation token email:", {
      token: (token as string).substring(0, 8) + "...",
      userId
    });

    const result = await emailClient.validateEmailToken(
      token as string,
      userId as string
    );

    if (result.success) {
      console.log("✅ [Route PUBLIC] Token validé avec succès");
      res.json({
        success: true,
        message: result.message,
        data: result.data,
        redirect_to: "/pages/connexion?verified=true"
      });
    } else {
      console.warn("⚠️ [Route PUBLIC] Échec validation token:", result.message);
      res.status(400).json({
        success: false,
        error: result.message,
        redirect_to: "/pages/connexion?error=invalid_token"
      });
    }
  } catch (error: any) {
    console.error("❌ [Route PUBLIC] Erreur validation token:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      redirect_to: "/pages/connexion?error=server_error"
    });
  }
});

/**
 * GET /api/utilisateurs/test-email-config
 * Test de configuration email
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   details: object
 * }
 */
router.get("/test-email-config", async (req, res) => {
  try {
    console.log("🔧 [Route] Test de configuration email demandé");

    const configTest = await emailService.testerConfiguration();

    res.json({
      success: configTest.success,
      message: configTest.success
        ? "Configuration email OK"
        : "Problèmes de configuration détectés",
      details: configTest.details
    });
  } catch (error: any) {
    console.error("❌ [Route] Erreur lors du test de config email:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du test de configuration",
      error: error.message
    });
  }
});

/**
 * POST /api/utilisateurs/test-email
 * Envoi d'un email de test
 *
 * Body:
 * {
 *   email: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   messageId?: string,
 *   details?: object
 * }
 */
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis pour le test"
      });
    }

    console.log("🧪 [Route] Test d'envoi email vers:", email);

    const result = await emailService.envoyerEmailTest(email);

    if (result.success) {
      res.json({
        success: true,
        message: "Email de test envoyé avec succès",
        messageId: result.messageId,
        details: result.details
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Échec de l'envoi de l'email de test",
        error: result.error,
        details: result.details
      });
    }
  } catch (error: any) {
    console.error("❌ [Route] Erreur lors du test d'email:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du test d'envoi d'email",
      error: error.message
    });
  }
});

/**
 * =============================================================================
 * ROUTES PROTÉGÉES (avec authentification)
 * =============================================================================
 */

/**
 * GET /api/utilisateurs/stats
 * Récupérer les statistiques des utilisateurs
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     totalUtilisateurs: number,
 *     utilisateursActifs: number,
 *     utilisateursInactifs: number
 *   }
 * }
 */
router.get("/stats", verifyToken, getStats);

/**
 * GET /api/utilisateurs?includeInactive=false
 * Récupérer tous les utilisateurs
 *
 * Query params:
 * - includeInactive (optionnel): Inclure les utilisateurs inactifs (défaut: false)
 *
 * Response:
 * {
 *   message: "Utilisateurs récupérés avec succès",
 *   data: [
 *     {
 *       id: number,
 *       prenom: string,
 *       nom: string,
 *       email: string,
 *       ...
 *     }
 *   ]
 * }
 */
router.get("/", verifyToken, getUtilisateurs);

/**
 * GET /api/utilisateurs/:id
 * Récupérer un utilisateur spécifique par ID
 *
 * Params:
 * - id: ID de l'utilisateur
 *
 * Response:
 * {
 *   message: "Utilisateur récupéré avec succès",
 *   data: {
 *     id: number,
 *     prenom: string,
 *     nom: string,
 *     email: string,
 *     ...
 *   }
 * }
 */
router.get("/:id", verifyToken, getUtilisateurById);

/**
 * PUT /api/utilisateurs/:id
 * Mettre à jour un utilisateur
 *
 * Params:
 * - id: ID de l'utilisateur
 *
 * Body (tous optionnels):
 * {
 *   email?: string,
 *   date_naissance?: string (YYYY-MM-DD),
 *   genres?: number,
 *   grades?: number,
 *   abonnement?: number,
 *   status?: number,
 *   password?: string
 * }
 *
 * Response:
 * {
 *   message: "Utilisateur mis à jour avec succès",
 *   data: object
 * }
 */
router.put("/:id", verifyToken, updateUtilisateur);

/**
 * DELETE /api/utilisateurs/:id?isConfirm=true
 * Supprimer définitivement un utilisateur (hard delete)
 *
 * Params:
 * - id: ID de l'utilisateur
 *
 * Query params:
 * - isConfirm: Confirmation de suppression (requis)
 *
 * Response:
 * {
 *   isConfirm: true,
 *   message: "Utilisateur supprimé avec succès",
 *   action: "hard_delete"
 * }
 */
router.delete("/:id", verifyToken, deleteUtilisateur);

/**
 * DELETE /api/utilisateurs/:id/soft?isConfirm=true
 * Désactiver un utilisateur (soft delete)
 *
 * Params:
 * - id: ID de l'utilisateur
 *
 * Query params:
 * - isConfirm: Confirmation de suppression (requis)
 *
 * Response:
 * {
 *   isConfirm: true,
 *   message: "Utilisateur désactivé avec succès",
 *   action: "soft_delete"
 * }
 */
router.delete("/:id/soft", verifyToken, async (req, res) => {
  try {
    const utilisateurId = parseInt(req.params.id, 10);

    if (isNaN(utilisateurId) || utilisateurId <= 0) {
      return res.status(400).json({
        isConfirm: false,
        message: "ID utilisateur invalide"
      });
    }

    const isConfirm = req.query.isConfirm === "true";

    if (!isConfirm) {
      return res.status(400).json({
        isConfirm: false,
        message: "Confirmation requise pour désactiver l'utilisateur"
      });
    }

    const { Utilisateurs } = await import("../../db/clients/utilisateurs/utilisateurs.js");
    const client = new Utilisateurs();
    const result = await client.supprimerSoft(utilisateurId);

    res.status(200).json({
      isConfirm: true,
      message: "Utilisateur désactivé avec succès",
      action: "soft_delete"
    });
  } catch (error: any) {
    console.error("❌ [Route Utilisateurs] Erreur suppression soft:", error);
    res.status(500).json({
      isConfirm: false,
      message: "Erreur lors de la désactivation de l'utilisateur"
    });
  }
});

console.log("✅ [Utilisateurs Routes] Routes utilisateurs initialisées avec succès");

export default router;
